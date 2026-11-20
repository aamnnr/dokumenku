"use client";

/**
 * Google Picker: jendela pemilih file Google Drive. Memilih file di sini
 * memberi aplikasi akses (scope drive.file) ke file itu saja.
 * https://developers.google.com/drive/picker
 */

interface PickerDoc {
  id: string;
  name?: string;
}

interface PickerResponse {
  action: string;
  docs?: PickerDoc[];
}

interface PickerInstance {
  setVisible(visible: boolean): void;
  dispose(): void;
}

interface PickerBuilder {
  addView(view: unknown): PickerBuilder;
  enableFeature(feature: string): PickerBuilder;
  setOAuthToken(token: string): PickerBuilder;
  setDeveloperKey(key: string): PickerBuilder;
  setAppId(appId: string): PickerBuilder;
  setOrigin(origin: string): PickerBuilder;
  setLocale(locale: string): PickerBuilder;
  setTitle(title: string): PickerBuilder;
  setMaxItems(max: number): PickerBuilder;
  setCallback(callback: (response: PickerResponse) => void): PickerBuilder;
  build(): PickerInstance;
}

interface DocsView {
  setParent(folderId: string): DocsView;
  setIncludeFolders(value: boolean): DocsView;
  setSelectFolderEnabled(value: boolean): DocsView;
  setMode(mode: string): DocsView;
}

interface PickerNamespace {
  PickerBuilder: new () => PickerBuilder;
  DocsView: new (viewId?: string) => DocsView;
  ViewId: { DOCS: string };
  DocsViewMode: { LIST: string };
  Feature: { MULTISELECT_ENABLED: string; SUPPORT_DRIVES: string };
  Action: { PICKED: string; CANCEL: string };
}

declare global {
  interface Window {
    gapi?: { load(name: string, options: { callback: () => void; onerror: () => void }): void };
    google?: { picker?: PickerNamespace };
  }
}

let loading: Promise<PickerNamespace> | null = null;

function loadPicker(): Promise<PickerNamespace> {
  if (window.google?.picker) return Promise.resolve(window.google.picker);
  loading ??= new Promise<PickerNamespace>((resolve, reject) => {
    const fail = () => {
      loading = null;
      reject(new Error("Gagal memuat Google Picker. Periksa koneksi internet."));
    };
    const onGapi = () =>
      window.gapi!.load("picker", {
        callback: () => (window.google?.picker ? resolve(window.google.picker) : fail()),
        onerror: fail,
      });

    if (window.gapi) {
      onGapi();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.async = true;
    script.onload = onGapi;
    script.onerror = fail;
    document.head.appendChild(script);
  });
  return loading;
}

export interface PickedFile {
  id: string;
  name: string;
}

/**
 * Buka Google Picker. Hasil: daftar file yang dipilih, atau `null` jika
 * pengguna membatalkan.
 */
export async function pickDriveFiles(maxItems = 50): Promise<PickedFile[] | null> {
  const [picker, tokenRes] = await Promise.all([loadPicker(), fetch("/api/import/token")]);
  const config = await tokenRes.json();
  if (!tokenRes.ok) throw new Error(config.error ?? "Gagal menyiapkan Google Drive.");

  return new Promise((resolve) => {
    const view = new picker.DocsView(picker.ViewId.DOCS)
      .setSelectFolderEnabled(false)
      .setMode(picker.DocsViewMode.LIST);
    // Dengan folder penyimpanan: hanya file langsung di folder itu, tanpa
    // subfolder (server juga menolak file di luar folder ini).
    if (config.folderId) view.setParent(config.folderId).setIncludeFolders(false);
    else view.setIncludeFolders(true);

    const builder = new picker.PickerBuilder()
      .addView(view)
      .enableFeature(picker.Feature.MULTISELECT_ENABLED);
    if (!config.folderId) builder.enableFeature(picker.Feature.SUPPORT_DRIVES);

    const instance: PickerInstance = builder
      .setMaxItems(maxItems)
      .setOAuthToken(config.accessToken)
      .setDeveloperKey(config.apiKey)
      .setAppId(config.appId)
      .setOrigin(window.location.origin)
      .setLocale("id")
      .setTitle(config.folderId ? "Pilih file dari folder Dokumenku" : "Pilih file untuk diimpor")
      .setCallback((response) => {
        if (response.action === picker.Action.PICKED) {
          instance.dispose();
          resolve((response.docs ?? []).map((doc) => ({ id: doc.id, name: doc.name ?? doc.id })));
        } else if (response.action === picker.Action.CANCEL) {
          instance.dispose();
          resolve(null);
        }
      })
      .build();
    instance.setVisible(true);
  });
}
