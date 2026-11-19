"use client";

import { useEffect } from "react";
import { initPwa } from "@/lib/pwa";

/** Mendaftarkan service worker & listener instalasi. Tidak merender apa pun. */
export default function PwaRegister() {
  useEffect(() => {
    initPwa();
  }, []);
  return null;
}
