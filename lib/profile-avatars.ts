export const DEFAULT_USER_AVATAR = "male/dobrodruh";

export const USER_AVATAR_OPTIONS = [
  { value: "male/dobrodruh", label: "Dobrodruh" },
  { value: "male/pilot", label: "Pilot" },
  { value: "male/profesor", label: "Profesor" },
  { value: "male/rytir", label: "Rytíř" },
  { value: "male/alchymista", label: "Alchymista" },
  { value: "male/detektiv", label: "Detektiv" },
  { value: "male/ucenec", label: "Učenec" },
  { value: "male/vynalezce", label: "Vynálezce" },
  { value: "male/mstitel", label: "Mstitel" },
  { value: "male/aristokrat", label: "Aristokrat" },
  { value: "female/dobrodruzka", label: "Dobrodružka" },
  { value: "female/pilotka", label: "Pilotka" },
  { value: "female/profesorka", label: "Profesorka" },
  { value: "female/rytirka", label: "Rytířka" },
  { value: "female/alchymistka", label: "Alchymistka" },
  { value: "female/detektivka", label: "Detektivka" },
  { value: "female/ucenkyne", label: "Učenkyně" },
  { value: "female/vynalezkyne", label: "Vynálezkyně" },
  { value: "female/mstitelka", label: "Mstitelka" },
  { value: "female/aristokratka", label: "Aristokratka" },
] as const;

export const USER_AVATAR_VALUES = USER_AVATAR_OPTIONS.map(
  (option) => option.value,
) as [string, ...string[]];

export type UserAvatarValue = (typeof USER_AVATAR_OPTIONS)[number]["value"];
