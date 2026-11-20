export interface FolderTheme {
  /** Gradien badan kartu, dimulai dari warna tab agar menyatu. */
  body: string;
  tab: string;
  /** Warna bagian dalam/belakang folder, terlihat saat folder terbuka. */
  back: string;
  border: string;
  /** Kotak warna kecil untuk daftar (favorit, halaman kategori). */
  swatch: string;
}

export const FOLDER_THEMES: FolderTheme[] = [
  {
    tab: "bg-[#E4E3FA]",
    back: "bg-[#CFCDF3]",
    body: "from-[#E4E3FA] to-[#F3F2FE]",
    border: "border-[#DDDCF6]",
    swatch: "bg-gradient-to-br from-[#C9C7F5] to-[#E4E3FA]",
  },
  {
    tab: "bg-[#DAEBFB]",
    back: "bg-[#C2DCF6]",
    body: "from-[#DAEBFB] to-[#F0F7FF]",
    border: "border-[#D3E6F8]",
    swatch: "bg-gradient-to-br from-[#B9DAF7] to-[#DAEBFB]",
  },
  {
    tab: "bg-[#FCE3D6]",
    back: "bg-[#F6CDB8]",
    body: "from-[#FCE3D6] to-[#FFF4EE]",
    border: "border-[#F7DCCD]",
    swatch: "bg-gradient-to-br from-[#F7C9B2] to-[#FCE3D6]",
  },
  {
    tab: "bg-[#D7F3E6]",
    back: "bg-[#BFE9D5]",
    body: "from-[#D7F3E6] to-[#EFFBF5]",
    border: "border-[#CDEDDD]",
    swatch: "bg-gradient-to-br from-[#B5E6CF] to-[#D7F3E6]",
  },
];
