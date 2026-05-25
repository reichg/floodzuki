import { Gage } from "./Gage";
import { Region } from "./Region";

export type GageMapProps = {
  onGagePress: (gage: Gage) => void;
  region?: Region;
  gages: Gage[];
};

export type InternalGageMapProps = GageMapProps & {
  singleGage: Gage | null;
};
