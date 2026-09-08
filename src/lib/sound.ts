export type SoundType =
  | "som_venda_aprovada"
  | "som_pix_gerado"
  | "som_venda_pendente"
  | "som_reembolso"
  | "som_chargeback"
  | "sale_approved"
  | "pix_pending"
  | "sale_pending"
  | "refund"
  | "chargeback";

const SOUND_MAP: Record<string, string> = {
  som_venda_aprovada: "/sounds/som_venda_aprovada.wav",
  sale_approved: "/sounds/som_venda_aprovada.wav",
  som_pix_gerado: "/sounds/som_pix_gerado.wav",
  pix_pending: "/sounds/som_pix_gerado.wav",
  som_venda_pendente: "/sounds/som_venda_pendente.wav",
  sale_pending: "/sounds/som_venda_pendente.wav",
  som_reembolso: "/sounds/som_reembolso.wav",
  refund: "/sounds/som_reembolso.wav",
  som_chargeback: "/sounds/som_chargeback.wav",
  chargeback: "/sounds/som_chargeback.wav",
};

const VIBRATION_PATTERNS: Record<string, number[]> = {
  som_venda_aprovada: [100, 50, 150, 50, 200], // Triunfo
  sale_approved: [100, 50, 150, 50, 200],
  som_pix_gerado: [100, 50, 100], // Espera
  pix_pending: [100, 50, 100],
  som_venda_pendente: [150, 75, 150], // Aviso pendente
  sale_pending: [150, 75, 150],
  som_reembolso: [200, 100, 150], // Alerta
  refund: [200, 100, 150],
  som_chargeback: [300, 100, 300], // Urgência
  chargeback: [300, 100, 300],
};

const audioCache = new Map<string, HTMLAudioElement>();

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem("utmt_sound_enabled");
  return stored === null ? true : stored === "true";
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("utmt_sound_enabled", enabled ? "true" : "false");
}

export function isVibrationEnabled(): boolean {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem("utmt_vibration_enabled");
  return stored === null ? true : stored === "true";
}

export function setVibrationEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("utmt_vibration_enabled", enabled ? "true" : "false");
}

export async function playNotificationSound(type: SoundType): Promise<void> {
  if (typeof window === "undefined") return;

  const soundPath = SOUND_MAP[type] || SOUND_MAP.som_venda_aprovada;

  // 1. Vibração háptica quando suportada e ativada
  if (isVibrationEnabled() && typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      const pattern = VIBRATION_PATTERNS[type] || [100];
      navigator.vibrate(pattern);
    } catch {
      // Ignore vibration error on unsupported platforms
    }
  }

  // 2. Reprodução de áudio quando ativado
  if (!isSoundEnabled()) return;

  try {
    let audio = audioCache.get(soundPath);
    if (!audio) {
      audio = new Audio(soundPath);
      audio.preload = "auto";
      audioCache.set(soundPath, audio);
    }

    audio.currentTime = 0;
    audio.volume = 1.0;
    await audio.play();
  } catch (err) {
    // Autoplay policy may block audio until user interaction
    console.warn("Audio playback prevented or failed:", err);
  }
}
