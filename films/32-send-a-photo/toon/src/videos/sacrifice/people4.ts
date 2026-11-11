// Film 33 cast. Dad keeps his red flannel and glasses in every era; Mom her mustard cardigan and bun; the son keeps
// his dark hair and grows: little boy (blue hoodie) -> teen (green hoodie) -> graduate -> man.
import type { Outfit } from "../sendphoto/toon2";
import { DAD as DAD32, SON as SON32 } from "../sendphoto/people";
export const DAD: Outfit = { ...DAD32, boots: "#7d7a80" };                               // older Dad, worn slippers
export const YDAD: Outfit = { ...DAD, hair: "#5a4030", moustache: "#5a4030" };           // twenty years ago
export const GUARD: Outfit = { ...YDAD, jacket: "#2c3e5c", plaid: undefined, hat: "cap", cap: "#2c3e5c", buttons: "#e8c45a" };
export const MOM: Outfit = { jacket: "#c9a24a", dress: "#5f6f8f", pants: "#5f6f8f", boots: "#6b4a32", hat: "hair", hair: "#6a4a3a", bun: true, skin: "#f6d2b4" };
export const OLDMOM: Outfit = { ...MOM, hair: "#d3ccc4" };
export const KID: Outfit = { jacket: "#6f9fd0", pants: "#3b5b9a", boots: "#8a7a6a", hat: "hair", hair: "#3b2a20", skin: "#f6d6ba", build: "kid" };
export const KIDNEW: Outfit = { ...KID, boots: "#fbfbf7" };                              // in the new sneakers
export const KIDJACKET: Outfit = { ...KIDNEW, jacket: "#3a78c2" };                       // in the new jacket
export const TEEN: Outfit = { ...SON32, jacket: "#4f8a5e", hood: true };
export const SON: Outfit = { ...SON32 };
export const GRAD: Outfit = { ...SON32, jacket: "#1d2333", pants: "#1d2333", boots: "#1e1e22", mortar: true };
export const FRIEND1: Outfit = { jacket: "#1d2333", pants: "#1d2333", boots: "#1e1e22", hat: "hair", hair: "#c9a05a", skin: "#f3d0b0", mortar: true };
export const FRIEND2: Outfit = { jacket: "#1d2333", pants: "#1d2333", boots: "#1e1e22", hat: "hair", hair: "#1e1612", skin: "#c99067", mortar: true };
export const SUIT: Outfit = { ...SON32, jacket: "#2b2e36", pants: "#23262e", boots: "#1e1e22" };
