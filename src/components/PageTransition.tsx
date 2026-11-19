import { ViewTransition } from "react";

/**
 * Bungkus isi setiap page.tsx (bukan layout) agar perpindahan halaman
 * bergeser sesuai arah: Link dengan transitionTypes={["nav-forward"]} atau
 * ["nav-back"]. Navigasi tanpa tipe (tombol back browser, refresh) tidak
 * dianimasikan.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition
      enter={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
      exit={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
