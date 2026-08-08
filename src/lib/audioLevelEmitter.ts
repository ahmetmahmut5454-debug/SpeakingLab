type LevelCallback = (level: number) => void;

class AudioLevelEmitter {
  private userListeners: Set<LevelCallback> = new Set();
  private botListeners: Set<LevelCallback> = new Set();

  public latestUserLevel = 0;
  public latestBotLevel = 0;

  emitUser(level: number) {
    this.latestUserLevel = level;
    this.userListeners.forEach((cb) => cb(level));
  }

  emitBot(level: number) {
    this.latestBotLevel = level;
    this.botListeners.forEach((cb) => cb(level));
  }

  subscribeUser(cb: LevelCallback) {
    this.userListeners.add(cb);
    return () => this.userListeners.delete(cb);
  }

  subscribeBot(cb: LevelCallback) {
    this.botListeners.add(cb);
    return () => this.botListeners.delete(cb);
  }
}

export const audioLevelEmitter = new AudioLevelEmitter();
