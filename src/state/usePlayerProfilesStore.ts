import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type PlayerProfileKind = 'human' | 'cpu';

export type HumanGameRecord = {
  id: string;
  playedAt: string;
  finalScore: number;
  place: 1 | 2 | 3 | 4;
};

export type CpuStrategyKey = 'random';

export type CpuStrategyStep = {
  strategy: CpuStrategyKey;
  order: number;
};

type BasePlayerProfile = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type HumanPlayerProfile = BasePlayerProfile & {
  kind: 'human';
  games: HumanGameRecord[];
  archivedAt?: string | null;
};

export type CpuPlayerProfile = BasePlayerProfile & {
  kind: 'cpu';
  strategies: CpuStrategyStep[];
};

type PlayerProfilesState = {
  mainHumanProfileId: string | null;
  humanProfiles: HumanPlayerProfile[];
  cpuProfiles: CpuPlayerProfile[];
  addHumanProfile(name: string): HumanPlayerProfile;
  createMainHumanProfile(name: string): HumanPlayerProfile;
  addCpuProfile(name: string, strategies?: CpuStrategyStep[]): CpuPlayerProfile;
  setMainHumanProfile(id: string): void;
  archiveHumanProfile(id: string): void;
  renameHumanProfile(id: string, name: string): void;
  renameCpuProfile(id: string, name: string): void;
  updateCpuStrategies(id: string, strategies: CpuStrategyStep[]): void;
  recordHumanGame(profileId: string, record: Omit<HumanGameRecord, 'id'>): void;
};

function nowIso(): string {
  return new Date().toISOString();
}

function createId(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${random}`;
}

function makeHumanProfile(name: string): HumanPlayerProfile {
  const timestamp = nowIso();
  return {
    id: createId('human'),
    kind: 'human',
    name,
    games: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function makeCpuProfile(name: string, strategies: CpuStrategyStep[] = [{ strategy: 'random', order: 0 }]): CpuPlayerProfile {
  const timestamp = nowIso();
  return {
    id: createId('cpu'),
    kind: 'cpu',
    name,
    strategies,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export const usePlayerProfilesStore = create<PlayerProfilesState>()(
  persist(
    (set) => ({
      mainHumanProfileId: null,
      humanProfiles: [],
      cpuProfiles: [
        makeCpuProfile('CPU 1'),
        makeCpuProfile('CPU 2'),
        makeCpuProfile('CPU 3'),
      ],

      addHumanProfile: (rawName) => {
        const profile = makeHumanProfile(rawName.trim() || 'New Player');
        set((state) => ({ humanProfiles: [...state.humanProfiles, profile] }));
        return profile;
      },

      createMainHumanProfile: (rawName) => {
        const profile = makeHumanProfile(rawName.trim() || 'Player');
        set((state) => ({
          mainHumanProfileId: profile.id,
          humanProfiles: [...state.humanProfiles, profile],
        }));
        return profile;
      },

      addCpuProfile: (rawName, strategies) => {
        const profile = makeCpuProfile(rawName.trim() || 'New CPU', strategies);
        set((state) => ({ cpuProfiles: [...state.cpuProfiles, profile] }));
        return profile;
      },

      setMainHumanProfile: (id) => {
        set((state) => ({
          mainHumanProfileId: state.humanProfiles.some((profile) => profile.id === id)
            ? id
            : state.mainHumanProfileId,
        }));
      },

      archiveHumanProfile: (id) => {
        const timestamp = nowIso();
        set((state) => ({
          mainHumanProfileId: state.mainHumanProfileId === id ? null : state.mainHumanProfileId,
          humanProfiles: state.humanProfiles.map((profile) =>
            profile.id === id ? { ...profile, archivedAt: timestamp, updatedAt: timestamp } : profile
          ),
        }));
      },

      renameHumanProfile: (id, rawName) => {
        const name = rawName.trim();
        if (!name) return;
        set((state) => ({
          humanProfiles: state.humanProfiles.map((profile) =>
            profile.id === id ? { ...profile, name, updatedAt: nowIso() } : profile
          ),
        }));
      },

      renameCpuProfile: (id, rawName) => {
        const name = rawName.trim();
        if (!name) return;
        set((state) => ({
          cpuProfiles: state.cpuProfiles.map((profile) =>
            profile.id === id ? { ...profile, name, updatedAt: nowIso() } : profile
          ),
        }));
      },

      updateCpuStrategies: (id, strategies) => {
        set((state) => ({
          cpuProfiles: state.cpuProfiles.map((profile) =>
            profile.id === id ? { ...profile, strategies, updatedAt: nowIso() } : profile
          ),
        }));
      },

      recordHumanGame: (profileId, record) => {
        const savedRecord: HumanGameRecord = {
          ...record,
          id: createId('game'),
        };
        set((state) => ({
          humanProfiles: state.humanProfiles.map((profile) =>
            profile.id === profileId
              ? { ...profile, games: [...profile.games, savedRecord], updatedAt: nowIso() }
              : profile
          ),
        }));
      },
    }),
    {
      name: 'hearts-player-profiles',
      storage: createJSONStorage(() => localStorage),
      version: 2,
      migrate: (persisted) => {
        if (!persisted || typeof persisted !== 'object') return persisted;
        const state = persisted as Partial<PlayerProfilesState>;
        const humanProfiles = (state.humanProfiles ?? []).filter(
          (profile) => !(profile.name === 'You' && profile.games.length === 0)
        );
        return {
          ...state,
          mainHumanProfileId:
            state.mainHumanProfileId && humanProfiles.some((profile) => profile.id === state.mainHumanProfileId)
              ? state.mainHumanProfileId
              : null,
          humanProfiles,
          cpuProfiles:
            state.cpuProfiles && state.cpuProfiles.length > 0
              ? state.cpuProfiles
              : [makeCpuProfile('CPU 1'), makeCpuProfile('CPU 2'), makeCpuProfile('CPU 3')],
        };
      },
    }
  )
);
