var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};

// pw/util.js
var require_util = __commonJS({
  "pw/util.js"(exports2, module2) {
    var fs = require("fs");
    var path = require("path");
    var TZ = "Asia/Jakarta";
    var setTimezone = (tz) => {
      if (tz) TZ = tz;
    };
    var getTimezone = () => TZ;
    function nowTs(d = /* @__PURE__ */ new Date()) {
      const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
        timeZone: TZ,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      }).formatToParts(d).map((x) => [x.type, x.value]));
      return `${p.year}-${p.month}-${p.day} ${p.hour === "24" ? "00" : p.hour}:${p.minute}:${p.second}`;
    }
    var COLORS = { info: "\x1B[36m", ok: "\x1B[32m", warn: "\x1B[33m", err: "\x1B[31m" };
    function log(msg, level = "info") {
      console.log(`${COLORS[level] || ""}[${nowTs()}] ${msg}\x1B[0m`);
    }
    var sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    function money(text) {
      const v = String(text ?? "").match(/\$?\s*([\d,.]+)\s*([KMB]?)/);
      if (!v) return -1;
      const mult = { K: 1e3, M: 1e6, B: 1e9 }[v[2]] || 1;
      const n = parseFloat(v[1].replace(/,/g, "")) * mult;
      return Number.isFinite(n) ? n : -1;
    }
    function margin(text) {
      const m = String(text ?? "").match(/([▲▼])\s*([\d,.]+)\s*%/);
      if (!m) return 0;
      const p = parseFloat(m[2].replace(/,/g, ""));
      return m[1] === "\u25BC" ? -p : p;
    }
    function ageHours(text) {
      const re = /(\d+(?:\.\d+)?)\s*(mo|min|[smhdwy])/gi;
      const mult = { s: 1 / 3600, m: 1 / 60, min: 1 / 60, h: 1, d: 24, w: 168, mo: 720, y: 8760 };
      let tot = 0;
      let found = false;
      let m;
      while ((m = re.exec(String(text ?? ""))) !== null) {
        const k = m[2].toLowerCase();
        if (mult[k] === void 0) continue;
        tot += parseFloat(m[1]) * mult[k];
        found = true;
      }
      return found ? tot : -1;
    }
    var cell = (v) => String(v ?? "").replace(/[,\r\n"]/g, " ").trim();
    function appendCsv(dir, file, values) {
      fs.mkdirSync(dir, { recursive: true });
      fs.appendFileSync(path.join(dir, file), values.map(cell).join(",") + "\n", "utf8");
    }
    module2.exports = { nowTs, log, sleep, money, margin, ageHours, appendCsv, setTimezone, getTimezone };
  }
});

// pw/config.js
var require_config = __commonJS({
  "pw/config.js"(exports2, module2) {
    var fs = require("fs");
    var path = require("path");
    var isExe = !["node.exe", "node"].includes(path.basename(process.execPath).toLowerCase());
    var BASE_DIR = isExe ? path.dirname(process.execPath) : path.join(__dirname, "..");
    var DEFAULTS = {
      // Jadwal (padanan config.json versi UI.Vision)
      timezone: "Asia/Jakarta",
      schedule: "*/15 * * * *",
      // cron mulai ulang run; '' = jalan terus tanpa jadwal
      runOnStart: true,
      // langsung jalan saat start, tidak menunggu jadwal pertama
      restartBrowser: true,
      // tutup & buka ulang Chrome tiap jadwal (padanan killChrome)
      restartWaitMs: 3e3,
      // jeda setelah Chrome ditutup (padanan killWaitMs)
      browser: {
        chromePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        userDataDir: "C:\\chrome-profiles\\fomo-playwright",
        headless: false,
        blockResources: false,
        viewport: { width: 1600, height: 1e3 }
      },
      profileUrl: "https://fomo.family/profile/VagueCoralJay?r=VagueCoralJay",
      dryRunSell: true,
      dryRunAd: true,
      tp: 20,
      tpCustom: {},
      exclude: [],
      adTrigger: -25,
      adMinAgeH: 6,
      adUseRsi: true,
      adRsiMax: 30,
      maxLoop: 0,
      scanIntervalMs: 6e3,
      reloadEvery: 4,
      clickTries: 3,
      clickFailMax: 3,
      errPauseMs: 6e4,
      output: {
        dir: "C:\\uivision\\datasources",
        positionsFile: "fomo_positions.csv",
        adLogFile: "fomo_ad_log.csv",
        sellLogFile: "fomo_sell_log.csv"
      },
      wait: {
        profileLoadMs: 5e3,
        popupMs: 3e3,
        detailMs: 4e3,
        afterActionMs: 2e3,
        clickTimeoutMs: 5e3,
        elementTimeoutMs: 1e4,
        rsiTimeoutMs: 4e3,
        rsiTries: 3,
        navTimeoutMs: 45e3
      },
      selectors: {
        row: "(//button[@data-slot='hover-card-trigger'][.//div[contains(@class,'w-24')]])",
        rowName: ".//div[contains(@class,'text-sm') and contains(@class,'truncate')]",
        rowValue: ".//div[contains(@class,'w-24')]",
        sellButton: "//button[normalize-space(text())='Sell' and contains(@class,'bg-red-transparent')]",
        sell100: "//button[normalize-space(text())='100%']",
        sellConfirm: "//button[contains(@class,'bg-accent-primary') and starts-with(normalize-space(.),'Sell ')]",
        popupName: "//a[@data-slot='hover-card-trigger' and contains(@href,'/tokens/')]//div[contains(@class,'text-lg')]",
        popupIcon: "//a[@data-slot='hover-card-trigger' and contains(@href,'/tokens/')][.//div[contains(@class,'text-lg')]]//img",
        detailAge: "(//span[@title and @translate='no' and contains(@class,'text-xs') and contains(@class,'text-text-secondary') and contains(@class,'shrink-0')])[1]",
        detailMarketCap: "//div[normalize-space(text())='Market cap']/following-sibling::div[1]",
        detailInvested: "//div[normalize-space(text())='Invested']/following-sibling::div[1]",
        detailAvgEntry: "//div[normalize-space(text())='Avg entry']/following-sibling::div[1]",
        rsiFrame: "iframe[id^='tradingview']",
        rsiValue: "//div[@data-qa-id='legend-source-item'][contains(.,'RSI')]//div[@data-test-id-value-title='Plot']//div[contains(@class,'valueValue')]",
        buyInput: "(//input[@placeholder='0' and contains(@class,'flex-1')])[1]",
        buyButton: "//button[contains(@class,'bg-accent-primary') and starts-with(normalize-space(.),'Buy ')]"
      }
    };
    var isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
    function merge(base, over) {
      const out = { ...base };
      for (const [k, v] of Object.entries(over || {})) {
        out[k] = isObj(v) && isObj(base[k]) && k !== "tpCustom" ? merge(base[k], v) : v;
      }
      return out;
    }
    function loadPwConfig() {
      const file = path.join(BASE_DIR, "pw.config.json");
      let user = {};
      try {
        user = JSON.parse(fs.readFileSync(file, "utf8"));
        console.log(`Config dibaca dari: ${file}`);
      } catch (e) {
        console.log(`pw.config.json tidak ditemukan/rusak di ${file} (${e.message}), pakai nilai bawaan`);
      }
      const cfg = merge(DEFAULTS, user);
      require_util().setTimezone(cfg.timezone);
      cfg.excludeSet = new Set((cfg.exclude || []).map((x) => String(x).trim().toLowerCase()).filter(Boolean));
      cfg.tpMap = Object.fromEntries(Object.entries(cfg.tpCustom || {}).map(([k, v]) => [String(k).trim().toLowerCase(), Number(v)]).filter(([, v]) => Number.isFinite(v)));
      return cfg;
    }
    module2.exports = { loadPwConfig, BASE_DIR };
  }
});

// pw/browser.js
var require_browser = __commonJS({
  "pw/browser.js"(exports2, module2) {
    var path = require("path");
    var { createRequire } = require("module");
    function loadPlaywright() {
      try {
        return require("playwright-core");
      } catch {
        const base = path.dirname(process.execPath);
        return createRequire(path.join(base, "index.js"))("playwright-core");
      }
    }
    var { chromium } = loadPlaywright();
    var BLOCK_TYPES = /* @__PURE__ */ new Set(["media", "font"]);
    async function openBrowser(cfg) {
      const b = cfg.browser;
      const context = await chromium.launchPersistentContext(b.userDataDir, {
        executablePath: b.chromePath,
        headless: !!b.headless,
        viewport: b.viewport,
        args: [
          "--disable-blink-features=AutomationControlled",
          "--disable-backgrounding-occluded-windows",
          "--disable-renderer-backgrounding",
          "--disable-background-timer-throttling",
          "--no-first-run",
          "--no-default-browser-check"
        ],
        ignoreDefaultArgs: ["--enable-automation"]
      });
      if (b.blockResources) {
        await context.route("**/*", (route) => BLOCK_TYPES.has(route.request().resourceType()) ? route.abort() : route.continue());
      }
      context.setDefaultTimeout(cfg.wait.elementTimeoutMs);
      context.setDefaultNavigationTimeout(cfg.wait.navTimeoutMs);
      return context;
    }
    module2.exports = { openBrowser };
  }
});

// pw/login.js
var require_login = __commonJS({
  "pw/login.js"() {
    var { loadPwConfig } = require_config();
    var { openBrowser } = require_browser();
    (async () => {
      const cfg = loadPwConfig();
      cfg.browser = { ...cfg.browser, headless: false, blockResources: false };
      console.log(`Profil Chrome: ${cfg.browser.userDataDir}`);
      console.log("Login ke fomo.family di jendela yang terbuka, lalu TUTUP jendelanya untuk selesai.");
      const context = await openBrowser(cfg);
      const page = context.pages()[0] || await context.newPage();
      await page.goto(cfg.profileUrl).catch(() => {
      });
      await new Promise((r) => context.on("close", r));
      console.log("Selesai. Sesi login tersimpan.");
      process.exit(0);
    })().catch((e) => {
      console.error(e);
      process.exit(1);
    });
  }
});

// node_modules/node-cron/dist/_shared.cjs
var require_shared = __commonJS({
  "node_modules/node-cron/dist/_shared.cjs"(exports2) {
    "use strict";
    var events = require("events");
    var node_crypto = require("node:crypto");
    function createID() {
      return node_crypto.randomUUID();
    }
    var levelColors = {
      INFO: "\x1B[36m",
      WARN: "\x1B[33m",
      ERROR: "\x1B[31m",
      DEBUG: "\x1B[35m"
    };
    var GREEN = "\x1B[32m";
    var RESET = "\x1B[0m";
    function log(level, message, extra) {
      const timestamp = (/* @__PURE__ */ new Date()).toISOString();
      const color = levelColors[level];
      const prefix = `[${timestamp}] [PID: ${process.pid}] ${GREEN}[NODE-CRON]${GREEN} ${color}[${level}]${RESET}`;
      const output = `${prefix} ${message}`;
      switch (level) {
        case "ERROR":
          console.error(output, extra ?? "");
          break;
        case "DEBUG":
          console.debug(output, extra ?? "");
          break;
        case "WARN":
          console.warn(output);
          break;
        case "INFO":
        default:
          console.info(output);
          break;
      }
    }
    var defaultLogger = {
      info(message) {
        log("INFO", message);
      },
      warn(message) {
        log("WARN", message);
      },
      error(message, err) {
        if (message instanceof Error) {
          log("ERROR", message.message, message);
        } else {
          log("ERROR", message, err);
        }
      },
      debug(message, err) {
        if (message instanceof Error) {
          log("DEBUG", message.message, message);
        } else {
          log("DEBUG", message, err);
        }
      }
    };
    var noopLogger = {
      info() {
      },
      warn() {
      },
      error() {
      },
      debug() {
      }
    };
    var activeLogger = defaultLogger;
    function setLogger(logger2) {
      activeLogger = logger2 ?? defaultLogger;
    }
    var logger = {
      info: (message) => activeLogger.info(message),
      warn: (message) => activeLogger.warn(message),
      error: (message, err) => activeLogger.error(message, err),
      debug: (message, err) => activeLogger.debug(message, err)
    };
    var TrackedPromise = class {
      promise;
      error;
      state;
      value;
      constructor(executor) {
        this.state = "pending";
        this.promise = new Promise((resolve, reject) => {
          executor((value) => {
            this.state = "fulfilled";
            this.value = value;
            resolve(value);
          }, (error) => {
            this.state = "rejected";
            this.error = error;
            reject(error);
          });
        });
      }
      getPromise() {
        return this.promise;
      }
      getState() {
        return this.state;
      }
      isPending() {
        return this.state === "pending";
      }
      isFulfilled() {
        return this.state === "fulfilled";
      }
      isRejected() {
        return this.state === "rejected";
      }
      getValue() {
        return this.value;
      }
      getError() {
        return this.error;
      }
      then(onfulfilled, onrejected) {
        return this.promise.then(onfulfilled, onrejected);
      }
      catch(onrejected) {
        return this.promise.catch(onrejected);
      }
      finally(onfinally) {
        return this.promise.finally(onfinally);
      }
    };
    function planBeat(expected, now, toleranceMs, getNextMatch) {
      const missed = [];
      let slot = expected;
      while (true) {
        const nowMs = now.getTime();
        const slotMs = slot.getTime();
        if (nowMs < slotMs) {
          return { missed, next: slot };
        }
        const next = getNextMatch(slot);
        if (next.getTime() <= slotMs) {
          return { missed, next: getNextMatch(now) };
        }
        const gap = next.getTime() - slotMs;
        const lateBy = nowMs - slotMs;
        if (lateBy <= toleranceMs && lateBy < gap) {
          return { missed, run: slot, next };
        }
        missed.push(slot);
        slot = next;
      }
    }
    var DEFAULT_MISSED_EXECUTION_TOLERANCE = 1e3;
    function emptyOnFn() {
    }
    function emptySkipFn() {
    }
    function emptyHookFn() {
      return true;
    }
    var DEFAULT_COORDINATOR_TTL = 3e4;
    var Runner = class {
      timeMatcher;
      onMatch;
      noOverlap;
      maxExecutions;
      maxRandomDelay;
      missedExecutionTolerance;
      runCount;
      running;
      heartBeatTimeout;
      jitterTimeout;
      logger;
      onMissedExecution;
      onOverlap;
      onError;
      beforeRun;
      onFinished;
      onMaxExecutions;
      runCoordinator;
      coordinatorKeyPrefix;
      coordinatorTtl;
      onSkipped;
      unref;
      constructor(timeMatcher, onMatch, options) {
        this.timeMatcher = timeMatcher;
        this.onMatch = onMatch;
        this.noOverlap = options == void 0 || options.noOverlap === void 0 ? false : options.noOverlap;
        this.maxExecutions = options?.maxExecutions;
        this.maxRandomDelay = options?.maxRandomDelay || 0;
        this.missedExecutionTolerance = options?.missedExecutionTolerance ?? DEFAULT_MISSED_EXECUTION_TOLERANCE;
        this.logger = options?.logger || logger;
        this.onMissedExecution = options?.onMissedExecution || emptyOnFn;
        this.onOverlap = options?.onOverlap || emptyOnFn;
        this.onError = options?.onError || ((date, error) => this.logger.error("Task failed with error!", error));
        this.onFinished = options?.onFinished || emptyHookFn;
        this.beforeRun = options?.beforeRun || emptyHookFn;
        this.onMaxExecutions = options?.onMaxExecutions || emptyOnFn;
        this.runCoordinator = options?.runCoordinator;
        this.coordinatorKeyPrefix = options?.coordinatorKeyPrefix || "";
        this.coordinatorTtl = options?.coordinatorTtl ?? DEFAULT_COORDINATOR_TTL;
        this.onSkipped = options?.onSkipped || emptySkipFn;
        this.unref = options?.unref ?? false;
        this.runCount = 0;
        this.running = false;
      }
      onErrorFallback = (date, error) => {
        this.logger.error("Task failed with error!", error);
      };
      async runCoordinated(slot, run) {
        if (!this.runCoordinator) {
          await run();
          return;
        }
        const key = `${this.coordinatorKeyPrefix}:${slot.toISOString()}`;
        let allowed;
        try {
          allowed = await this.runCoordinator.shouldRun(key, this.coordinatorTtl);
        } catch (err) {
          this.logger.error("Run coordinator failed; skipping execution (fail-closed)", err);
          this.emitSkipped(slot, "coordinator-error");
          return;
        }
        if (!allowed) {
          this.emitSkipped(slot, "not-elected");
          return;
        }
        try {
          await run();
        } finally {
          try {
            await this.runCoordinator.onComplete?.(key);
          } catch (err) {
            this.logger.error("Run coordinator onComplete failed", err);
          }
        }
      }
      emitSkipped(slot, reason) {
        Promise.resolve(this.onSkipped(slot, reason)).catch((err) => this.onErrorFallback(slot, err));
      }
      start() {
        this.running = true;
        let lastExecution;
        let expectedNextExecution = this.timeMatcher.getNextMatch(nowWithoutMs());
        const armHeartBeat = () => {
          if (this.running) {
            clearTimeout(this.heartBeatTimeout);
            this.heartBeatTimeout = setTimeout(heartBeat, getDelay(expectedNextExecution));
            if (this.unref)
              this.heartBeatTimeout.unref();
          }
        };
        const runTask = async (date) => {
          const execution = {
            id: createID(),
            reason: "scheduled"
          };
          let shouldExecute;
          try {
            shouldExecute = await this.beforeRun(date, execution);
          } catch (error) {
            this.onError(date, error, execution);
            return;
          }
          if (!shouldExecute)
            return;
          const execute = async () => {
            try {
              this.runCount++;
              execution.startedAt = /* @__PURE__ */ new Date();
              const result = await this.onMatch(date, execution);
              execution.finishedAt = /* @__PURE__ */ new Date();
              execution.result = result;
            } catch (error) {
              execution.finishedAt = /* @__PURE__ */ new Date();
              execution.error = error;
              try {
                this.onError(date, error, execution);
              } catch (hookError) {
                this.onErrorFallback(date, hookError);
              }
              return;
            }
            try {
              await this.onFinished(date, execution);
            } catch (hookError) {
              this.onErrorFallback(date, hookError);
            }
            if (this.maxExecutions && this.runCount >= this.maxExecutions) {
              this.onMaxExecutions(date);
              this.stop();
            }
          };
          const randomDelay = Math.floor(Math.random() * this.maxRandomDelay);
          if (randomDelay > 0) {
            await new Promise((resolve) => {
              this.jitterTimeout = setTimeout(() => {
                execute().then(() => resolve(), () => resolve());
              }, randomDelay);
              if (this.unref)
                this.jitterTimeout.unref();
            });
          } else {
            await execute();
          }
        };
        const heartBeat = async () => {
          const currentDate = nowWithoutMs();
          const plan = planBeat(expectedNextExecution, currentDate, this.missedExecutionTolerance, (date) => this.timeMatcher.getNextMatch(date));
          expectedNextExecution = plan.next;
          for (const missedSlot of plan.missed) {
            runAsync(this.onMissedExecution, missedSlot, this.onErrorFallback);
          }
          if (plan.run) {
            if (lastExecution && lastExecution.getState() === "pending") {
              runAsync(this.onOverlap, plan.run, this.onErrorFallback);
              if (this.noOverlap) {
                this.logger.warn("task still running, new execution blocked by overlap prevention!");
                armHeartBeat();
                return;
              }
            }
            const slot = plan.run;
            lastExecution = new TrackedPromise(async (resolve, reject) => {
              try {
                await this.runCoordinated(slot, () => runTask(slot));
                resolve(true);
              } catch (err) {
                reject(err);
              }
            });
            lastExecution.catch(() => {
            });
          }
          armHeartBeat();
        };
        armHeartBeat();
      }
      nextRun() {
        return this.timeMatcher.getNextMatch(/* @__PURE__ */ new Date());
      }
      stop() {
        this.running = false;
        if (this.heartBeatTimeout) {
          clearTimeout(this.heartBeatTimeout);
          this.heartBeatTimeout = void 0;
        }
        if (this.jitterTimeout) {
          clearTimeout(this.jitterTimeout);
          this.jitterTimeout = void 0;
        }
      }
      isStarted() {
        return !!this.heartBeatTimeout && this.running;
      }
      isStopped() {
        return !this.isStarted();
      }
      setUnref(value) {
        this.unref = value;
        if (this.heartBeatTimeout) {
          if (value)
            this.heartBeatTimeout.unref();
          else
            this.heartBeatTimeout.ref();
        }
        if (this.jitterTimeout) {
          if (value)
            this.jitterTimeout.unref();
          else
            this.jitterTimeout.ref();
        }
      }
      async execute(executionId) {
        const date = /* @__PURE__ */ new Date();
        const execution = {
          id: executionId ?? createID(),
          reason: "invoked"
        };
        try {
          const shouldExecute = await this.beforeRun(date, execution);
          if (!shouldExecute)
            return;
          execution.startedAt = /* @__PURE__ */ new Date();
          const result = await this.onMatch(date, execution);
          execution.finishedAt = /* @__PURE__ */ new Date();
          execution.result = result;
        } catch (error) {
          execution.finishedAt = /* @__PURE__ */ new Date();
          execution.error = error;
          this.onError(date, error, execution);
          return;
        }
        try {
          await this.onFinished(date, execution);
        } catch (hookError) {
          this.onErrorFallback(date, hookError);
        }
      }
    };
    async function runAsync(fn, date, onError) {
      try {
        await fn(date);
      } catch (error) {
        onError(date, error);
      }
    }
    function getDelay(nextRun) {
      const maxDelay = 864e5;
      const now = /* @__PURE__ */ new Date();
      const delay = nextRun.getTime() - now.getTime();
      if (delay > maxDelay) {
        return maxDelay;
      }
      return Math.max(0, delay);
    }
    function nowWithoutMs() {
      const date = /* @__PURE__ */ new Date();
      date.setMilliseconds(0);
      return date;
    }
    var monthNamesConversion = /* @__PURE__ */ (() => {
      const months = [
        "january",
        "february",
        "march",
        "april",
        "may",
        "june",
        "july",
        "august",
        "september",
        "october",
        "november",
        "december"
      ];
      const shortMonths = [
        "jan",
        "feb",
        "mar",
        "apr",
        "may",
        "jun",
        "jul",
        "aug",
        "sep",
        "oct",
        "nov",
        "dec"
      ];
      function convertMonthName(expression, items) {
        for (let i = 0; i < items.length; i++) {
          expression = expression.replace(new RegExp(items[i], "gi"), i + 1);
        }
        return expression;
      }
      function interpret(monthExpression) {
        monthExpression = convertMonthName(monthExpression, months);
        monthExpression = convertMonthName(monthExpression, shortMonths);
        return monthExpression;
      }
      return interpret;
    })();
    var weekDayNamesConversion = /* @__PURE__ */ (() => {
      const weekDays = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday"
      ];
      const shortWeekDays = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
      function convertWeekDayName(expression, items) {
        for (let i = 0; i < items.length; i++) {
          expression = expression.replace(new RegExp(items[i], "gi"), i);
        }
        return expression;
      }
      function convertWeekDays(expression) {
        expression = convertWeekDayName(expression, weekDays);
        return convertWeekDayName(expression, shortWeekDays);
      }
      return convertWeekDays;
    })();
    var convertAsterisksToRanges = /* @__PURE__ */ (() => {
      function convertAsterisk(expression, replecement) {
        return expression.split(",").map((token) => token.indexOf("*") !== -1 ? token.replace("*", replecement) : token).join(",");
      }
      function convertAsterisksToRanges2(expressions) {
        expressions[0] = convertAsterisk(expressions[0], "0-59");
        expressions[1] = convertAsterisk(expressions[1], "0-59");
        expressions[2] = convertAsterisk(expressions[2], "0-23");
        expressions[3] = convertAsterisk(expressions[3], "1-31");
        expressions[4] = convertAsterisk(expressions[4], "1-12");
        expressions[5] = convertAsterisk(expressions[5], "0-6");
        return expressions;
      }
      return convertAsterisksToRanges2;
    })();
    var convertRanges = /* @__PURE__ */ (() => {
      const rangeRegEx = /^(\d+)-(\d+)(?:\/(\d+))?$/;
      const FIELD_BOUNDS = [
        { min: 0, max: 59 },
        { min: 0, max: 59 },
        { min: 0, max: 23 },
        { min: 1, max: 31 },
        { min: 1, max: 12 },
        { min: 0, max: 6 }
      ];
      function expandRange(initTxt, endTxt, stepTxt, bounds) {
        const step = parseInt(stepTxt, 10);
        if (!(step >= 1))
          return `${initTxt}-${endTxt}/${stepTxt}`;
        const first = parseInt(initTxt, 10);
        const last = parseInt(endTxt, 10);
        const numbers = [];
        if (first <= last) {
          for (let i = first; i <= last; i += step) {
            numbers.push(i);
          }
          return numbers.join();
        }
        const { min, max } = bounds;
        const size = max - min + 1;
        const span = ((last - first) % size + size) % size;
        for (let offset = 0; offset <= span; offset += step) {
          let value = first + offset;
          if (value > max)
            value -= size;
          numbers.push(value);
        }
        return numbers.join();
      }
      function convertRange(expression, bounds) {
        return expression.split(",").map((token) => {
          const match = rangeRegEx.exec(token.trim());
          return match ? expandRange(match[1], match[2], match[3] || "1", bounds) : token;
        }).join();
      }
      function convertAllRanges(expressions) {
        for (let i = 0; i < expressions.length; i++) {
          expressions[i] = convertRange(expressions[i], FIELD_BOUNDS[i]);
        }
        return expressions;
      }
      return convertAllRanges;
    })();
    var NICKNAMES = {
      "@yearly": "0 0 1 1 *",
      "@annually": "0 0 1 1 *",
      "@monthly": "0 0 1 * *",
      "@weekly": "0 0 * * 0",
      "@daily": "0 0 * * *",
      "@midnight": "0 0 * * *",
      "@hourly": "0 * * * *"
    };
    function resolveNickname(expression) {
      const key = expression.trim().toLowerCase();
      return NICKNAMES[key] ?? expression;
    }
    var convertExpression = /* @__PURE__ */ (() => {
      function appendSecondExpression(expressions) {
        if (expressions.length === 5) {
          return ["0"].concat(expressions);
        }
        return expressions;
      }
      function removeSpaces(str) {
        return str.replace(/\s{2,}/g, " ").trim();
      }
      function normalizeIntegers(expressions) {
        for (let i = 0; i < expressions.length; i++) {
          const numbers = expressions[i].split(",");
          for (let j = 0; j < numbers.length; j++) {
            const token = String(numbers[j]).trim();
            if (/^l$/i.test(token)) {
              numbers[j] = "L";
            } else if (/^l-\d{1,2}$/i.test(token)) {
              numbers[j] = token.toUpperCase();
            } else if (/^[0-7]l$/i.test(token)) {
              numbers[j] = token.toUpperCase();
            } else if (/w/i.test(token)) {
              numbers[j] = token.toUpperCase();
            } else if (token.indexOf("#") !== -1) {
              numbers[j] = token;
            } else if (/^\d+$/.test(token)) {
              numbers[j] = parseInt(token, 10);
            } else {
              numbers[j] = token;
            }
          }
          expressions[i] = numbers;
        }
        return expressions;
      }
      function convertQuestionMarks(expressions) {
        if (expressions[3] === "?")
          expressions[3] = "*";
        if (expressions[5] === "?")
          expressions[5] = "*";
        return expressions;
      }
      function interpret(expression) {
        let expressions = removeSpaces(resolveNickname(`${expression}`)).split(" ");
        expressions = appendSecondExpression(expressions);
        expressions = convertQuestionMarks(expressions);
        expressions[4] = monthNamesConversion(expressions[4]);
        expressions[5] = weekDayNamesConversion(expressions[5]);
        expressions = convertAsterisksToRanges(expressions);
        expressions = convertRanges(expressions);
        expressions = normalizeIntegers(expressions);
        const weekdays = expressions[5];
        for (let i = 0; i < weekdays.length; i++) {
          if (weekdays[i] === 7)
            weekdays[i] = 0;
          else if (typeof weekdays[i] === "string" && weekdays[i].startsWith("7")) {
            weekdays[i] = "0" + weekdays[i].slice(1);
          }
        }
        expressions[5] = [...new Set(weekdays)];
        return expressions;
      }
      return interpret;
    })();
    var LocalizedTime = class {
      timestamp;
      parts;
      timezone;
      constructor(date, timezone) {
        this.timestamp = date.getTime();
        this.timezone = timezone;
        this.parts = buildDateParts(date, timezone);
      }
      toDate() {
        return new Date(this.timestamp);
      }
      toISO() {
        const gmt = this.parts.gmt.replace(/^GMT/, "");
        const offset = gmt ? gmt : "Z";
        const pad = (n) => String(n).padStart(2, "0");
        return `${this.parts.year}-${pad(this.parts.month)}-${pad(this.parts.day)}T${pad(this.parts.hour)}:${pad(this.parts.minute)}:${pad(this.parts.second)}.${String(this.parts.millisecond).padStart(3, "0")}` + offset;
      }
      getParts() {
        return this.parts;
      }
    };
    function getOffsetMinutes(date, timezone) {
      const offset = parseOffsetMinutes(getTimezoneGMT(date, timezone).replace(/^GMT/, "") || "Z");
      return offset ?? 0;
    }
    function readsBackTo(timestamp, parts, timezone) {
      const p = buildDateParts(new Date(timestamp), timezone);
      return p.year === parts.year && p.month === parts.month && p.day === parts.day && p.hour === parts.hour && p.minute === parts.minute && p.second === parts.second;
    }
    function localTimeToTimestamp(parts, timezone) {
      const guess = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second, parts.millisecond);
      const firstOffset = getOffsetMinutes(new Date(guess), timezone);
      const candidate1 = guess - firstOffset * 6e4;
      const secondOffset = getOffsetMinutes(new Date(candidate1), timezone);
      if (secondOffset === firstOffset) {
        return candidate1;
      }
      const candidate2 = guess - secondOffset * 6e4;
      if (readsBackTo(candidate1, parts, timezone))
        return candidate1;
      if (readsBackTo(candidate2, parts, timezone))
        return candidate2;
      return Math.max(candidate1, candidate2);
    }
    var partsFormatterCache = /* @__PURE__ */ new Map();
    var offsetFormatterCache = /* @__PURE__ */ new Map();
    function getPartsFormatter(timezone) {
      const key = timezone ?? "";
      let formatter = partsFormatterCache.get(key);
      if (!formatter) {
        const dftOptions = {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          weekday: "short",
          hour12: false
        };
        if (timezone) {
          dftOptions.timeZone = timezone;
        }
        formatter = new Intl.DateTimeFormat("en-US", dftOptions);
        partsFormatterCache.set(key, formatter);
      }
      return formatter;
    }
    function getOffsetFormatter(timezone) {
      const key = timezone ?? "";
      let formatter = offsetFormatterCache.get(key);
      if (!formatter) {
        formatter = new Intl.DateTimeFormat("en-US", {
          timeZone: timezone,
          timeZoneName: "shortOffset"
        });
        offsetFormatterCache.set(key, formatter);
      }
      return formatter;
    }
    function buildDateParts(date, timezone) {
      const dateFormat = getPartsFormatter(timezone);
      const parts = dateFormat.formatToParts(date).filter((part) => {
        return part.type !== "literal";
      }).reduce((acc, part) => {
        acc[part.type] = part.value;
        return acc;
      }, {});
      const result = {
        day: parseInt(parts.day),
        month: parseInt(parts.month),
        year: parseInt(parts.year),
        hour: parts.hour === "24" ? 0 : parseInt(parts.hour),
        minute: parseInt(parts.minute),
        second: parseInt(parts.second),
        millisecond: date.getMilliseconds(),
        weekday: parts.weekday
      };
      let gmt;
      Object.defineProperty(result, "gmt", {
        enumerable: true,
        configurable: true,
        get() {
          return gmt ??= getTimezoneGMT(date, timezone);
        }
      });
      return result;
    }
    function parseOffsetMinutes(isoString) {
      if (isoString.endsWith("Z"))
        return 0;
      const match = isoString.match(/([+-])(\d{2}):(\d{2})$/);
      if (!match)
        return null;
      const sign = match[1] === "+" ? 1 : -1;
      return sign * (parseInt(match[2]) * 60 + parseInt(match[3]));
    }
    function getTimezoneGMT(date, timezone) {
      const fmt = getOffsetFormatter(timezone);
      const parts = fmt.formatToParts(date);
      const tzPart = parts.find((p) => p.type === "timeZoneName");
      if (!tzPart)
        return "Z";
      const tzValue = tzPart.value;
      if (tzValue === "GMT")
        return "Z";
      const match = tzValue.match(/^GMT([+-])(\d{1,2})(?::(\d{2}))?$/);
      if (!match)
        return "Z";
      const sign = match[1];
      const hoursNum = parseInt(match[2]);
      const minutesNum = parseInt(match[3] || "0");
      if (hoursNum === 0 && minutesNum === 0)
        return "Z";
      const hours = match[2].padStart(2, "0");
      const minutes = (match[3] || "00").padStart(2, "0");
      return `GMT${sign}${hours}:${minutes}`;
    }
    var LAST_DAY_TOKEN = "L";
    var WEEKDAY_TOKEN = /^(\d{1,2}|L)W$/;
    var LAST_DAY_OFFSET_TOKEN = /^L-(\d{1,2})$/;
    function lastDayOfMonth(year, month) {
      return new Date(Date.UTC(year, month, 0)).getUTCDate();
    }
    function nearestWeekday(year, month, target) {
      const last = lastDayOfMonth(year, month);
      if (target < 1 || target > last)
        return -1;
      const weekday = new Date(Date.UTC(year, month - 1, target)).getUTCDay();
      if (weekday === 6)
        return target === 1 ? target + 2 : target - 1;
      if (weekday === 0)
        return target === last ? target - 2 : target + 1;
      return target;
    }
    function matchesDayOfMonth(field, year, month, day) {
      for (const value of field) {
        if (value === day)
          return true;
        if (value === LAST_DAY_TOKEN && day === lastDayOfMonth(year, month))
          return true;
        if (typeof value === "string") {
          const weekdayMatch = WEEKDAY_TOKEN.exec(value);
          if (weekdayMatch) {
            const target = weekdayMatch[1] === LAST_DAY_TOKEN ? lastDayOfMonth(year, month) : parseInt(weekdayMatch[1], 10);
            if (nearestWeekday(year, month, target) === day)
              return true;
          }
          const offsetMatch = LAST_DAY_OFFSET_TOKEN.exec(value);
          if (offsetMatch) {
            const target = lastDayOfMonth(year, month) - parseInt(offsetMatch[1], 10);
            if (target >= 1 && target === day)
              return true;
          }
        }
      }
      return false;
    }
    var LAST_WEEKDAY_REGEX = /^([0-7])L$/i;
    var NTH_WEEKDAY_REGEX = /^([0-7])#([1-5])$/;
    function parseLastWeekdayToken(value) {
      if (typeof value !== "string")
        return null;
      const match = LAST_WEEKDAY_REGEX.exec(value);
      if (!match)
        return null;
      const weekday = parseInt(match[1], 10);
      return weekday === 7 ? 0 : weekday;
    }
    function isLastWeekdayOfMonth(year, month, day) {
      const date = new Date(Date.UTC(year, month - 1, day));
      const inSevenDays = new Date(date.getTime());
      inSevenDays.setUTCDate(inSevenDays.getUTCDate() + 7);
      return inSevenDays.getUTCMonth() + 1 !== month;
    }
    function isNthWeekdayToken(value) {
      return typeof value === "string" && NTH_WEEKDAY_REGEX.test(value);
    }
    function parseNthWeekday(value) {
      if (typeof value !== "string")
        return null;
      const match = NTH_WEEKDAY_REGEX.exec(value);
      if (!match)
        return null;
      const weekday = parseInt(match[1], 10) % 7;
      const nth = parseInt(match[2], 10);
      return { weekday, nth };
    }
    function occurrenceInMonth(day) {
      return Math.floor((day - 1) / 7) + 1;
    }
    function matchesNthWeekday(token, year, month, day) {
      const parsed = parseNthWeekday(token);
      if (!parsed)
        return false;
      const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
      if (weekday !== parsed.weekday)
        return false;
      return occurrenceInMonth(day) === parsed.nth;
    }
    function matchesDayOfWeek(field, year, month, day, weekday) {
      for (const value of field) {
        if (value === weekday)
          return true;
        if (isNthWeekdayToken(value)) {
          if (matchesNthWeekday(value, year, month, day))
            return true;
          continue;
        }
        const lastWeekday = parseLastWeekdayToken(value);
        if (lastWeekday !== null && lastWeekday === weekday && isLastWeekdayOfMonth(year, month, day)) {
          return true;
        }
      }
      return false;
    }
    var MAX_DAYS = 366 * 100;
    var MatcherWalker = class {
      baseDate;
      timeMatcher;
      timezone;
      seconds;
      minutes;
      hours;
      days;
      months;
      weekdays;
      constructor(timeMatcher, baseDate, timezone) {
        this.baseDate = baseDate;
        this.timeMatcher = timeMatcher;
        this.timezone = timezone;
        const expressions = timeMatcher.expressions;
        this.seconds = sortedAsc(expressions[0]);
        this.minutes = sortedAsc(expressions[1]);
        this.hours = sortedAsc(expressions[2]);
        this.days = expressions[3];
        this.months = expressions[4];
        this.weekdays = expressions[5];
      }
      isMatching() {
        return this.timeMatcher.match(this.baseDate);
      }
      matchNext() {
        const months = this.months;
        const days = this.days;
        const baseMs = Math.floor(this.baseDate.getTime() / 1e3) * 1e3;
        const baseParts = new LocalizedTime(new Date(baseMs), this.timezone).getParts();
        let { year, month, day } = baseParts;
        for (let i = 0; i < MAX_DAYS; i++) {
          if (months.includes(month) && matchesDayOfMonth(days, year, month, day) && this.matchesWeekday(year, month, day)) {
            const lowerBound = i === 0 ? baseParts : null;
            const found = this.firstTimeOnDay(year, month, day, lowerBound, baseMs);
            if (found !== null) {
              return new LocalizedTime(new Date(found), this.timezone);
            }
          }
          ({ year, month, day } = nextDay(year, month, day));
        }
        throw new Error("Could not find next matching date within reasonable time range");
      }
      firstTimeOnDay(year, month, day, lowerBound, baseMs) {
        const { seconds, minutes, hours } = this;
        for (const hour of hours) {
          if (lowerBound && hour < lowerBound.hour)
            continue;
          for (const minute of minutes) {
            for (const second of seconds) {
              if (lowerBound && !isLaterInDay(hour, minute, second, lowerBound))
                continue;
              const ts = localTimeToTimestamp({ year, month, day, hour, minute, second, millisecond: 0 }, this.timezone);
              if (ts > baseMs && this.timeMatcher.match(new Date(ts))) {
                return ts;
              }
            }
          }
        }
        return null;
      }
      matchesWeekday(year, month, day) {
        const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
        return matchesDayOfWeek(this.weekdays, year, month, day, weekday);
      }
    };
    function nextDay(year, month, day) {
      const d = new Date(Date.UTC(year, month - 1, day + 1));
      return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
    }
    function sortedAsc(values) {
      return [...values].sort((a, b) => a - b);
    }
    function isLaterInDay(hour, minute, second, bound) {
      return hour * 3600 + minute * 60 + second > bound.hour * 3600 + bound.minute * 60 + bound.second;
    }
    function matchValue(allowedValues, value) {
      return allowedValues.indexOf(value) !== -1;
    }
    var TimeMatcher = class {
      timezone;
      pattern;
      expressions;
      constructor(pattern, timezone) {
        this.timezone = timezone;
        this.pattern = pattern;
        this.expressions = convertExpression(pattern);
      }
      match(date) {
        const localizedTime = new LocalizedTime(date, this.timezone);
        const parts = localizedTime.getParts();
        const runOnSecond = matchValue(this.expressions[0], parts.second);
        const runOnMinute = matchValue(this.expressions[1], parts.minute);
        const runOnHour = matchValue(this.expressions[2], parts.hour);
        const runOnDay = matchesDayOfMonth(this.expressions[3], parts.year, parts.month, parts.day);
        const runOnMonth = matchValue(this.expressions[4], parts.month);
        const weekday = parseInt(weekDayNamesConversion(parts.weekday));
        const runOnWeekDay = matchesDayOfWeek(this.expressions[5], parts.year, parts.month, parts.day, weekday);
        return runOnSecond && runOnMinute && runOnHour && runOnDay && runOnMonth && runOnWeekDay;
      }
      getNextMatch(date) {
        const walker = new MatcherWalker(this, date, this.timezone);
        const next = walker.matchNext();
        return next.toDate();
      }
    };
    var allowedTransitions = {
      "stopped": ["stopped", "idle", "destroyed"],
      "idle": ["idle", "running", "stopped", "destroyed"],
      "running": ["running", "idle", "stopped", "destroyed"],
      "destroyed": ["destroyed"]
    };
    var StateMachine = class {
      state;
      constructor(initial = "stopped") {
        this.state = initial;
      }
      changeState(state) {
        if (allowedTransitions[this.state].includes(state)) {
          this.state = state;
        } else {
          throw new Error(`invalid transition from ${this.state} to ${state}`);
        }
      }
    };
    var EnvVarRunCoordinator = class {
      envName;
      constructor(envName = "NODE_CRON_RUN") {
        this.envName = envName;
        this.read();
      }
      shouldRun() {
        return this.read();
      }
      read() {
        const value = process.env[this.envName];
        if (value !== "true" && value !== "false") {
          throw new Error(`node-cron: a \`distributed\` task needs ${this.envName} set to 'true' or 'false'. Set it to 'true' on exactly one instance and 'false' on the others, or provide a coordinator via cron.setRunCoordinator(...).`);
        }
        return value === "true";
      }
    };
    var globalRunCoordinator;
    function setRunCoordinator(coordinator) {
      globalRunCoordinator = coordinator;
    }
    function resolveRunCoordinator(perTask) {
      return perTask ?? globalRunCoordinator ?? new EnvVarRunCoordinator();
    }
    var TaskEmitter = class extends events.EventEmitter {
    };
    function safeEmit(emitter, event, context, onError) {
      for (const listener of emitter.listeners(event)) {
        try {
          Promise.resolve(listener(context)).catch(onError);
        } catch (error) {
          onError(error);
        }
      }
    }
    var InlineScheduledTask = class {
      emitter;
      cronExpression;
      timeMatcher;
      runner;
      id;
      name;
      stateMachine;
      timezone;
      logger;
      suppressMissedWarning;
      _lastRun = null;
      constructor(cronExpression, taskFn, options) {
        this.emitter = new TaskEmitter();
        this.cronExpression = cronExpression;
        this.id = createID();
        this.name = options?.name || this.id;
        this.timezone = options?.timezone;
        this.logger = options?.logger || logger;
        this.suppressMissedWarning = options?.suppressMissedWarning || false;
        this.timeMatcher = new TimeMatcher(cronExpression, options?.timezone);
        this.stateMachine = new StateMachine();
        const runnerOptions = {
          timezone: options?.timezone,
          noOverlap: options?.noOverlap,
          maxExecutions: options?.maxExecutions,
          maxRandomDelay: options?.maxRandomDelay,
          missedExecutionTolerance: options?.missedExecutionTolerance,
          logger: this.logger,
          beforeRun: (date, execution) => {
            if (execution.reason === "scheduled") {
              this.changeState("running");
            }
            this.emit("execution:started", this.createContext(date, execution));
            return true;
          },
          onFinished: (date, execution) => {
            if (execution.reason === "scheduled") {
              this.changeState("idle");
            }
            this.recordLastRun(execution);
            this.emit("execution:finished", this.createContext(date, execution));
            return true;
          },
          onError: (date, error, execution) => {
            this.logger.error(error);
            this.recordLastRun(execution);
            this.emit("execution:failed", this.createContext(date, execution));
            this.changeState("idle");
          },
          onOverlap: (date) => {
            this.emit("execution:overlap", this.createContext(date));
          },
          onMissedExecution: (date) => {
            const handled = this.emitter.listenerCount("execution:missed") > 0;
            if (!this.suppressMissedWarning && !handled) {
              this.logger.warn(`missed execution at ${date}! Possible blocking IO or high CPU user at the same process used by node-cron.`);
            }
            this.emit("execution:missed", this.createContext(date));
          },
          onMaxExecutions: (date) => {
            this.emit("execution:maxReached", this.createContext(date));
            this.destroy();
          },
          runCoordinator: options?.distributed ? resolveRunCoordinator(options?.runCoordinator) : void 0,
          coordinatorKeyPrefix: this.name,
          coordinatorTtl: options?.distributedLease,
          onSkipped: (date, reason) => {
            this.emit("execution:skipped", this.createContext(date, void 0, reason));
          },
          unref: options?.unref
        };
        this.runner = new Runner(this.timeMatcher, (date, execution) => {
          return taskFn(this.createContext(date, execution));
        }, runnerOptions);
      }
      getNextRun() {
        if (this.stateMachine.state !== "stopped") {
          return this.runner.nextRun();
        }
        return null;
      }
      getNextRuns(count) {
        const runs = [];
        let from = /* @__PURE__ */ new Date();
        for (let i = 0; i < count; i++) {
          from = this.timeMatcher.getNextMatch(from);
          runs.push(from);
        }
        return runs;
      }
      match(date) {
        return this.timeMatcher.match(date);
      }
      msToNext() {
        const next = this.getNextRun();
        return next ? next.getTime() - Date.now() : null;
      }
      isBusy() {
        return this.getStatus() === "running";
      }
      runsLeft() {
        if (this.runner.maxExecutions == null)
          return void 0;
        return Math.max(0, this.runner.maxExecutions - this.runner.runCount);
      }
      getPattern() {
        return this.cronExpression;
      }
      lastRun() {
        return this._lastRun;
      }
      recordLastRun(execution) {
        const date = execution.finishedAt;
        const lastRun = { date };
        if (execution.error) {
          lastRun.error = execution.error;
        } else {
          lastRun.result = execution.result;
        }
        this._lastRun = lastRun;
      }
      emit(event, context) {
        safeEmit(this.emitter, event, context, (error) => this.logger.error(error));
      }
      changeState(state) {
        if (this.runner.isStarted()) {
          this.stateMachine.changeState(state);
        }
      }
      start() {
        if (this.stateMachine.state === "destroyed")
          return;
        if (this.runner.isStopped()) {
          this.runner.start();
          this.stateMachine.changeState("idle");
          this.emit("task:started", this.createContext(/* @__PURE__ */ new Date()));
        }
      }
      stop() {
        if (this.runner.isStarted()) {
          this.runner.stop();
          this.stateMachine.changeState("stopped");
          this.emit("task:stopped", this.createContext(/* @__PURE__ */ new Date()));
        }
      }
      getStatus() {
        return this.stateMachine.state;
      }
      unref() {
        this.runner.setUnref(true);
      }
      ref() {
        this.runner.setUnref(false);
      }
      destroy() {
        if (this.stateMachine.state === "destroyed")
          return;
        this.stop();
        this.stateMachine.changeState("destroyed");
        this.emit("task:destroyed", this.createContext(/* @__PURE__ */ new Date()));
      }
      execute(executionId) {
        const id = executionId ?? createID();
        return new Promise((resolve, reject) => {
          const onFail = (context) => {
            if (context.execution?.id !== id)
              return;
            this.off("execution:finished", onFinished);
            this.off("execution:failed", onFail);
            reject(context.execution?.error);
          };
          const onFinished = (context) => {
            if (context.execution?.id !== id)
              return;
            this.off("execution:finished", onFinished);
            this.off("execution:failed", onFail);
            resolve(context.execution?.result);
          };
          this.on("execution:finished", onFinished);
          this.on("execution:failed", onFail);
          this.runner.execute(id);
        });
      }
      on(event, fun) {
        this.emitter.on(event, fun);
      }
      off(event, fun) {
        this.emitter.off(event, fun);
      }
      once(event, fun) {
        this.emitter.once(event, fun);
      }
      createContext(executionDate, execution, reason) {
        const localTime = new LocalizedTime(executionDate, this.timezone);
        const ctx = {
          date: localTime.toDate(),
          dateLocalIso: localTime.toISO(),
          triggeredAt: /* @__PURE__ */ new Date(),
          task: this,
          execution
        };
        if (reason)
          ctx.reason = reason;
        return ctx;
      }
    };
    exports2.InlineScheduledTask = InlineScheduledTask;
    exports2.LocalizedTime = LocalizedTime;
    exports2.StateMachine = StateMachine;
    exports2.TimeMatcher = TimeMatcher;
    exports2.convertExpression = convertExpression;
    exports2.createID = createID;
    exports2.isNthWeekdayToken = isNthWeekdayToken;
    exports2.logger = logger;
    exports2.noopLogger = noopLogger;
    exports2.resolveNickname = resolveNickname;
    exports2.resolveRunCoordinator = resolveRunCoordinator;
    exports2.setLogger = setLogger;
    exports2.setRunCoordinator = setRunCoordinator;
  }
});

// node_modules/node-cron/dist/node-cron.cjs
var require_node_cron = __commonJS({
  "node_modules/node-cron/dist/node-cron.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var inlineScheduledTask = require_shared();
    var path = require("path");
    var url = require("url");
    var child_process = require("child_process");
    var events = require("events");
    require("node:crypto");
    var tasks = /* @__PURE__ */ new Map();
    var TaskRegistry = class {
      add(task) {
        if (this.has(task.id)) {
          throw Error(`task ${task.id} already registered!`);
        }
        tasks.set(task.id, task);
        task.on("task:destroyed", () => {
          this.remove(task);
        });
      }
      get(taskId) {
        return tasks.get(taskId);
      }
      remove(task) {
        if (this.has(task.id)) {
          tasks.delete(task.id);
          task.destroy();
        }
      }
      all() {
        return tasks;
      }
      has(taskId) {
        return tasks.has(taskId);
      }
      killAll() {
        tasks.forEach((id) => this.remove(id));
      }
    };
    var validationRegex = /^(?:\d+|\*|\*\/\d+)$/;
    var ALLOWED_CHARS_REGEX = /^[a-zA-Z0-9-*/,#? ]+$/;
    function splitFields(resolved) {
      return resolved.replace(/\s{2,}/g, " ").trim().split(" ");
    }
    function isValidExpression(expression, min, max) {
      const options = expression;
      for (const option of options) {
        const optionAsInt = parseInt(option, 10);
        if (!Number.isNaN(optionAsInt) && (optionAsInt < min || optionAsInt > max) || !validationRegex.test(option))
          return false;
      }
      return true;
    }
    function isInvalidSecond(expression) {
      return !isValidExpression(expression, 0, 59);
    }
    function isInvalidMinute(expression) {
      return !isValidExpression(expression, 0, 59);
    }
    function isInvalidHour(expression) {
      return !isValidExpression(expression, 0, 23);
    }
    var DAY_OF_MONTH_W_TOKEN = /^(\d{1,2}|L)W$/i;
    var DAY_OF_MONTH_OFFSET_TOKEN = /^L-(\d{1,2})$/i;
    function isInvalidDayOfMonth(expression) {
      const days = expression.filter((value) => {
        if (value === "L")
          return false;
        const weekday = DAY_OF_MONTH_W_TOKEN.exec(String(value));
        if (weekday) {
          if (weekday[1] === "L")
            return false;
          const target = parseInt(weekday[1], 10);
          return target < 1 || target > 31;
        }
        const offset = DAY_OF_MONTH_OFFSET_TOKEN.exec(String(value));
        if (offset) {
          const n = parseInt(offset[1], 10);
          return n < 1 || n > 30;
        }
        return true;
      });
      return !isValidExpression(days, 1, 31);
    }
    function hasInvalidWModifier(rawDayOfMonth) {
      if (!/w/i.test(rawDayOfMonth))
        return false;
      return rawDayOfMonth.split(",").some((token) => {
        const value = token.trim();
        if (!/w/i.test(value))
          return false;
        return !DAY_OF_MONTH_W_TOKEN.test(value);
      });
    }
    function isInvalidMonth(expression) {
      return !isValidExpression(expression, 1, 12);
    }
    function isInvalidWeekDay(expression) {
      const days = expression.filter((value) => !inlineScheduledTask.isNthWeekdayToken(value) && !/^[0-7]L$/.test(value));
      return !isValidExpression(days, 0, 7);
    }
    var MAX_DAYS_IN_MONTH = {
      1: 31,
      2: 29,
      3: 31,
      4: 30,
      5: 31,
      6: 30,
      7: 31,
      8: 31,
      9: 30,
      10: 31,
      11: 30,
      12: 31
    };
    function isImpossibleDayOfMonth(days, months) {
      if (days.some((day) => typeof day !== "number"))
        return false;
      return !months.some((month) => days.some((day) => day <= MAX_DAYS_IN_MONTH[month]));
    }
    function validateFields(patterns, executablePatterns) {
      if (isInvalidSecond(executablePatterns[0]))
        throw new Error(`${patterns[0]} is a invalid expression for second`);
      if (isInvalidMinute(executablePatterns[1]))
        throw new Error(`${patterns[1]} is a invalid expression for minute`);
      if (isInvalidHour(executablePatterns[2]))
        throw new Error(`${patterns[2]} is a invalid expression for hour`);
      if (isInvalidDayOfMonth(executablePatterns[3]) || hasInvalidWModifier(patterns[3]))
        throw new Error(`${patterns[3]} is a invalid expression for day of month`);
      if (isInvalidMonth(executablePatterns[4]))
        throw new Error(`${patterns[4]} is a invalid expression for month`);
      if (isInvalidWeekDay(executablePatterns[5]))
        throw new Error(`${patterns[5]} is a invalid expression for week day`);
      if (isImpossibleDayOfMonth(executablePatterns[3], executablePatterns[4]))
        throw new Error(`${patterns[3]} ${patterns[4]} is an impossible day of month for the given month`);
    }
    var FIELDS = [
      { key: "second", label: "second", invalid: isInvalidSecond },
      { key: "minute", label: "minute", invalid: isInvalidMinute },
      { key: "hour", label: "hour", invalid: isInvalidHour },
      { key: "dayOfMonth", label: "day of month", invalid: isInvalidDayOfMonth },
      { key: "month", label: "month", invalid: isInvalidMonth },
      { key: "dayOfWeek", label: "week day", invalid: isInvalidWeekDay }
    ];
    function validateDetailed$1(pattern) {
      if (typeof pattern !== "string")
        return { valid: false, errors: [{ field: "expression", message: "pattern must be a string" }] };
      const resolved = inlineScheduledTask.resolveNickname(pattern);
      if (!ALLOWED_CHARS_REGEX.test(resolved))
        return { valid: false, errors: [{ field: "expression", value: pattern, message: "pattern includes illegal characters" }] };
      const raw = splitFields(resolved);
      if (raw.length !== 5 && raw.length !== 6)
        return { valid: false, errors: [{ field: "expression", value: pattern, message: `expected 5 or 6 fields but got ${raw.length}` }] };
      const patterns = raw.length === 5 ? ["0", ...raw] : raw;
      const executable = inlineScheduledTask.convertExpression(pattern);
      const errors = [];
      FIELDS.forEach((f, i) => {
        const rawWMisuse = f.key === "dayOfMonth" && hasInvalidWModifier(patterns[i]);
        if (f.invalid(executable[i]) || rawWMisuse)
          errors.push({ field: f.key, value: patterns[i], message: `${patterns[i]} is a invalid expression for ${f.label}` });
      });
      if (!errors.length && isImpossibleDayOfMonth(executable[3], executable[4])) {
        errors.push({
          field: "dayOfMonth",
          value: patterns[3],
          message: `${patterns[3]} ${patterns[4]} is an impossible day of month for the given month`
        });
      }
      if (errors.length)
        return { valid: false, errors };
      return {
        valid: true,
        errors: [],
        fields: {
          second: executable[0],
          minute: executable[1],
          hour: executable[2],
          dayOfMonth: executable[3],
          month: executable[4],
          dayOfWeek: executable[5]
        }
      };
    }
    function parse$1(pattern) {
      const result = validateDetailed$1(pattern);
      if (!result.valid)
        throw new Error(result.errors[0].message);
      return result.fields;
    }
    function validate$1(pattern) {
      if (typeof pattern !== "string")
        throw new TypeError("pattern must be a string!");
      const resolved = inlineScheduledTask.resolveNickname(pattern);
      if (!ALLOWED_CHARS_REGEX.test(resolved))
        throw new TypeError("pattern includes illegal characters!");
      const raw = splitFields(resolved);
      if (raw.length !== 5 && raw.length !== 6)
        throw new Error(`expected 5 or 6 fields but got ${raw.length}`);
      const patterns = raw.length === 5 ? ["0", ...raw] : raw;
      const executablePatterns = inlineScheduledTask.convertExpression(resolved);
      validateFields(patterns, executablePatterns);
    }
    var daemonPath = path.resolve(path.dirname(__filename), "daemon.cjs");
    var TaskEmitter = class extends events.EventEmitter {
    };
    var BackgroundScheduledTask = class {
      emitter;
      id;
      name;
      cronExpression;
      taskPath;
      options;
      forkProcess;
      stateMachine;
      logger;
      suppressMissedWarning;
      timeMatcher;
      runCount;
      runCoordinator;
      _lastRun = null;
      executing = false;
      killPending = false;
      pendingKillCleanup;
      currentExecution;
      killRequested = false;
      startPromise;
      constructor(cronExpression, taskPath, options) {
        this.cronExpression = cronExpression;
        this.taskPath = taskPath;
        this.options = options;
        this.id = inlineScheduledTask.createID();
        this.name = options?.name || this.id;
        this.emitter = new TaskEmitter();
        this.stateMachine = new inlineScheduledTask.StateMachine("stopped");
        this.timeMatcher = new inlineScheduledTask.TimeMatcher(cronExpression, options?.timezone);
        this.runCount = 0;
        this.on("execution:started", (context) => {
          if (context?.execution?.reason === "scheduled")
            this.runCount++;
          this.executing = true;
          this.currentExecution = context?.execution;
        });
        this.on("execution:finished", (context) => {
          this.executing = false;
          this.currentExecution = void 0;
          this.recordLastRun(context.execution);
        });
        this.on("execution:failed", (context) => {
          this.executing = false;
          this.currentExecution = void 0;
          this.recordLastRun(context.execution);
        });
        this.logger = options?.logger || inlineScheduledTask.logger;
        this.suppressMissedWarning = options?.suppressMissedWarning || false;
        this.runCoordinator = options?.distributed ? inlineScheduledTask.resolveRunCoordinator(options?.runCoordinator) : void 0;
        this.on("task:stopped", () => {
          this.killForkWhenSettled();
          if (this.stateMachine.state !== "destroyed") {
            this.stateMachine.changeState("stopped");
          }
        });
        this.on("task:destroyed", () => {
          this.killForkWhenSettled();
          this.stateMachine.changeState("destroyed");
        });
      }
      getNextRun() {
        if (this.stateMachine.state !== "stopped") {
          return this.timeMatcher.getNextMatch(/* @__PURE__ */ new Date());
        }
        return null;
      }
      getNextRuns(count) {
        const runs = [];
        let from = /* @__PURE__ */ new Date();
        for (let i = 0; i < count; i++) {
          from = this.timeMatcher.getNextMatch(from);
          runs.push(from);
        }
        return runs;
      }
      match(date) {
        return this.timeMatcher.match(date);
      }
      msToNext() {
        const next = this.getNextRun();
        return next ? next.getTime() - Date.now() : null;
      }
      isBusy() {
        return this.getStatus() === "running";
      }
      runsLeft() {
        if (this.options?.maxExecutions == null)
          return void 0;
        return Math.max(0, this.options.maxExecutions - this.runCount);
      }
      getPattern() {
        return this.cronExpression;
      }
      lastRun() {
        return this._lastRun;
      }
      recordLastRun(execution) {
        if (!execution)
          return;
        const raw = execution.finishedAt ?? execution.startedAt;
        const date = raw ? new Date(raw) : /* @__PURE__ */ new Date();
        const lastRun = { date };
        if (execution.error) {
          lastRun.error = execution.error;
        } else {
          lastRun.result = execution.result;
        }
        this._lastRun = lastRun;
      }
      killForkWhenSettled() {
        if (!this.forkProcess)
          return;
        if (!this.executing) {
          this.killFork();
          return;
        }
        if (this.killPending)
          return;
        this.killPending = true;
        const onSettled = () => this.killFork();
        this.once("execution:finished", onSettled);
        this.once("execution:failed", onSettled);
        this.pendingKillCleanup = () => {
          this.off("execution:finished", onSettled);
          this.off("execution:failed", onSettled);
        };
      }
      clearPendingKillWait() {
        this.pendingKillCleanup?.();
        this.pendingKillCleanup = void 0;
        this.killPending = false;
      }
      killFork() {
        this.clearPendingKillWait();
        this.killRequested = true;
        this.forkProcess?.kill();
        this.forkProcess = void 0;
      }
      handleUnexpectedExit(code, signal) {
        this.clearPendingKillWait();
        const erro = new Error(`daemon exited unexpectedly (code ${code}, signal ${signal})`);
        this.logger.error(erro);
        if (this.executing) {
          const execution = { id: inlineScheduledTask.createID(), reason: "scheduled", ...this.currentExecution, error: erro, finishedAt: /* @__PURE__ */ new Date() };
          this.emitter.emit("execution:failed", this.createContext(/* @__PURE__ */ new Date(), execution));
        }
        try {
          this.stateMachine.changeState("stopped");
        } catch (err) {
          this.logger.error(err);
        }
        const context = this.createContext(/* @__PURE__ */ new Date());
        context.error = erro;
        this.emitter.emit("task:failed", context);
        this.forkProcess = void 0;
      }
      start() {
        if (this.stateMachine.state === "destroyed") {
          return Promise.resolve();
        }
        if (this.startPromise) {
          return this.startPromise;
        }
        if (this.forkProcess) {
          return Promise.resolve();
        }
        this.startPromise = this.forkAndStart().finally(() => {
          this.startPromise = void 0;
        });
        return this.startPromise;
      }
      forkAndStart() {
        return new Promise((resolve, reject) => {
          const startTimeout = this.options?.startTimeout ?? 5e3;
          const failStart = (error) => {
            clearTimeout(timeout);
            this.killFork();
            reject(error);
          };
          const timeout = setTimeout(() => {
            failStart(new Error(`Start operation timed out after ${startTimeout}ms. The background task file may have failed to load or taken too long to import; verify it runs on its own and consider increasing the \`startTimeout\` option.`));
          }, startTimeout);
          this.killRequested = false;
          let startSucceeded = false;
          try {
            this.forkProcess = child_process.fork(daemonPath);
            this.forkProcess.on("error", (err) => {
              failStart(new Error(`Error on daemon: ${err.message}`));
            });
            this.forkProcess.on("exit", (code, signal) => {
              if (this.killRequested) {
                this.killRequested = false;
                return;
              }
              if (code !== 0 && signal !== "SIGTERM") {
                if (startSucceeded) {
                  this.handleUnexpectedExit(code, signal);
                  return;
                }
                const erro = new Error(`node-cron daemon exited with code ${code || signal}`);
                this.logger.error(erro);
                failStart(erro);
              }
            });
            this.forkProcess.on("message", (message) => {
              if (message.type === "coordinator:shouldRun") {
                void this.handleShouldRun(message);
                return;
              }
              if (message.type === "coordinator:complete") {
                this.runCoordinator?.onComplete?.(message.key)?.catch?.((err) => this.logger.error("Run coordinator onComplete failed", err));
                return;
              }
              if (message.event === "daemon:error") {
                failStart(message.jsonError ? deserializeError(message.jsonError) : new Error("Background task failed to start"));
                return;
              }
              if (message.jsonError) {
                if (message.context?.execution) {
                  message.context.execution.error = deserializeError(message.jsonError);
                  delete message.jsonError;
                }
              }
              if (message.context?.task?.state) {
                this.stateMachine.changeState(message.context?.task?.state);
              }
              if (message.context) {
                const execution = message.context?.execution;
                delete execution?.hasError;
                const context = this.createContext(new Date(message.context.date), execution, message.context.reason);
                this.logEvent(message.event, context);
                this.emitter.emit(message.event, context);
              }
            });
            this.once("task:started", () => {
              startSucceeded = true;
              this.stateMachine.changeState("idle");
              clearTimeout(timeout);
              resolve(void 0);
            });
            this.forkProcess.send({
              command: "task:start",
              path: this.taskPath,
              cron: this.cronExpression,
              options: serializableOptions(this.options)
            });
          } catch (error) {
            failStart(error);
          }
        });
      }
      stop() {
        return new Promise((resolve, reject) => {
          if (this.stateMachine.state === "destroyed") {
            return resolve(void 0);
          }
          if (!this.forkProcess) {
            this.emitter.emit("task:stopped");
            return resolve(void 0);
          }
          const timeoutId = setTimeout(() => {
            clearTimeout(timeoutId);
            this.killFork();
            reject(new Error("Stop operation timed out"));
          }, 5e3);
          const cleanupAndResolve = () => {
            clearTimeout(timeoutId);
            this.off("task:stopped", onStopped);
            resolve(void 0);
          };
          const onStopped = () => {
            cleanupAndResolve();
          };
          this.once("task:stopped", onStopped);
          this.forkProcess.send({
            command: "task:stop"
          });
        });
      }
      getStatus() {
        return this.stateMachine.state;
      }
      unref() {
        if (!this.forkProcess)
          return;
        this.forkProcess.unref();
        this.forkProcess.channel?.unref();
      }
      ref() {
        if (!this.forkProcess)
          return;
        this.forkProcess.ref();
        this.forkProcess.channel?.ref();
      }
      destroy() {
        return new Promise((resolve, reject) => {
          if (this.stateMachine.state === "destroyed") {
            return resolve(void 0);
          }
          if (!this.forkProcess) {
            this.emitter.emit("task:destroyed");
            return resolve(void 0);
          }
          const timeoutId = setTimeout(() => {
            clearTimeout(timeoutId);
            this.killFork();
            reject(new Error("Destroy operation timed out"));
          }, 5e3);
          const onDestroy = () => {
            clearTimeout(timeoutId);
            this.off("task:destroyed", onDestroy);
            resolve(void 0);
          };
          this.once("task:destroyed", onDestroy);
          this.forkProcess.send({
            command: "task:destroy"
          });
        });
      }
      execute() {
        return new Promise((resolve, reject) => {
          if (!this.forkProcess) {
            return reject(new Error("Cannot execute background task because it hasn't been started yet. Please initialize the task using the start() method before attempting to execute it."));
          }
          const executionId = inlineScheduledTask.createID();
          let timeoutId;
          if (typeof this.options?.executeTimeout === "number") {
            timeoutId = setTimeout(() => {
              cleanupListeners();
              reject(new Error("Execution timeout exceeded"));
            }, this.options.executeTimeout);
          }
          const cleanupListeners = () => {
            if (timeoutId)
              clearTimeout(timeoutId);
            this.off("execution:finished", onFinished);
            this.off("execution:failed", onFail);
          };
          const onFinished = (context) => {
            if (context.execution?.id !== executionId)
              return;
            cleanupListeners();
            resolve(context.execution?.result);
          };
          const onFail = (context) => {
            if (context.execution?.id !== executionId)
              return;
            cleanupListeners();
            reject(context.execution?.error || new Error("Execution failed without specific error"));
          };
          this.on("execution:finished", onFinished);
          this.on("execution:failed", onFail);
          this.forkProcess.send({
            command: "task:execute",
            executionId
          });
        });
      }
      async handleShouldRun(message) {
        let allowed = false;
        let error;
        try {
          allowed = this.runCoordinator ? await this.runCoordinator.shouldRun(message.key, message.ttlMs) : false;
        } catch (err) {
          error = err?.message ?? String(err);
        }
        this.forkProcess?.send({ type: "coordinator:result", reqId: message.reqId, allowed, error });
      }
      on(event, fun) {
        this.emitter.on(event, fun);
      }
      off(event, fun) {
        this.emitter.off(event, fun);
      }
      once(event, fun) {
        this.emitter.once(event, fun);
      }
      logEvent(event, context) {
        switch (event) {
          case "execution:missed": {
            const handled = this.emitter.listenerCount("execution:missed") > 0;
            if (!this.suppressMissedWarning && !handled) {
              this.logger.warn(`missed execution at ${context.date}! Possible blocking IO or high CPU user at the same process used by node-cron.`);
            }
            break;
          }
          case "execution:overlap":
            if (this.options?.noOverlap) {
              this.logger.warn("task still running, new execution blocked by overlap prevention!");
            }
            break;
          case "execution:failed":
            if (context.execution?.error) {
              this.logger.error(context.execution.error);
            }
            break;
        }
      }
      createContext(executionDate, execution, reason) {
        const localTime = new inlineScheduledTask.LocalizedTime(executionDate, this.options?.timezone);
        const ctx = {
          date: localTime.toDate(),
          dateLocalIso: localTime.toISO(),
          triggeredAt: /* @__PURE__ */ new Date(),
          task: this,
          execution
        };
        if (reason)
          ctx.reason = reason;
        return ctx;
      }
    };
    function serializableOptions(options) {
      if (!options)
        return options;
      const { logger: _logger, runCoordinator: _runCoordinator, ...rest } = options;
      return rest;
    }
    function deserializeError(str) {
      const data = JSON.parse(str);
      const Err = globalThis[data.name] || Error;
      const err = new Err(data.message);
      if (data.stack) {
        err.stack = data.stack;
      }
      Object.keys(data).forEach((key) => {
        if (!["name", "message", "stack"].includes(key)) {
          err[key] = data[key];
        }
      });
      return err;
    }
    var moduleFilename = __filename;
    var registry = new TaskRegistry();
    function schedule(expression, func, options) {
      const task = createTask(expression, func, options);
      let started;
      try {
        started = task.start();
      } catch (error) {
        registry.remove(task);
        throw error;
      }
      if (started && typeof started.catch === "function") {
        started.catch((error) => {
          (options?.logger || inlineScheduledTask.logger).error(`Failed to start scheduled task: ${error?.message ?? error}`);
        });
      }
      return task;
    }
    function createTask(expression, func, options) {
      parse$1(expression);
      if (options?.distributed && !options.name) {
        throw new Error("`distributed` requires a `name` (it forms the coordination key shared across instances).");
      }
      let task;
      if (func instanceof Function) {
        task = new inlineScheduledTask.InlineScheduledTask(expression, func, options);
      } else {
        const taskPath = solvePath(func);
        task = new BackgroundScheduledTask(expression, taskPath, options);
      }
      registry.add(task);
      return task;
    }
    function solvePath(filePath) {
      if (path.isAbsolute(filePath))
        return url.pathToFileURL(filePath).href;
      if (filePath.startsWith("file://"))
        return filePath;
      const stackLines = new Error().stack?.split("\n");
      if (stackLines) {
        stackLines?.shift();
        const callerLine = stackLines?.find((line) => {
          return line.indexOf(moduleFilename) === -1;
        });
        const match = callerLine?.match(/(file:\/\/)?(((\/?)(\w:))?([/\\].+)):\d+:\d+/);
        if (match) {
          const dir = `${match[5] ?? ""}${path.dirname(match[6])}`;
          return url.pathToFileURL(path.resolve(dir, filePath)).href;
        }
      }
      throw new Error(`Could not locate task file ${filePath}`);
    }
    function validate(expression) {
      try {
        validate$1(expression);
        return true;
      } catch (e) {
        return false;
      }
    }
    var validateDetailed = validateDetailed$1;
    var parse = parse$1;
    async function shutdown(timeout = 5e3) {
      const tasks2 = registry.all();
      const pending = [];
      for (const task of tasks2.values()) {
        const wait = new Promise((resolve) => {
          const onSettled = () => {
            task.off("execution:finished", onSettled);
            task.off("execution:failed", onSettled);
            resolve();
          };
          task.once("execution:finished", onSettled);
          task.once("execution:failed", onSettled);
        });
        const busy = task.isBusy();
        Promise.resolve(task.stop()).catch((error) => {
          inlineScheduledTask.logger.error(`Error stopping task "${task.name}" during shutdown: ${error?.message ?? error}`);
        });
        if (busy) {
          pending.push(wait);
        }
      }
      if (pending.length) {
        await Promise.race([
          Promise.allSettled(pending),
          new Promise((r) => setTimeout(r, timeout))
        ]);
      }
      for (const task of tasks2.values()) {
        Promise.resolve(task.destroy()).catch((error) => {
          inlineScheduledTask.logger.error(`Error destroying task "${task.name}" during shutdown: ${error?.message ?? error}`);
        });
      }
    }
    var getTasks = registry.all;
    var getTask = registry.get;
    var nodeCron = {
      schedule,
      createTask,
      validate,
      validateDetailed,
      parse,
      getTasks,
      getTask,
      setLogger: inlineScheduledTask.setLogger,
      setRunCoordinator: inlineScheduledTask.setRunCoordinator,
      shutdown
    };
    exports2.setLogger = inlineScheduledTask.setLogger;
    exports2.setRunCoordinator = inlineScheduledTask.setRunCoordinator;
    exports2.createTask = createTask;
    exports2.default = nodeCron;
    exports2.getTask = getTask;
    exports2.getTasks = getTasks;
    exports2.nodeCron = nodeCron;
    exports2.parse = parse;
    exports2.schedule = schedule;
    exports2.shutdown = shutdown;
    exports2.solvePath = solvePath;
    exports2.validate = validate;
    exports2.validateDetailed = validateDetailed;
  }
});

// pw/scanner.js
var require_scanner = __commonJS({
  "pw/scanner.js"(exports2, module2) {
    var { log, sleep, nowTs, money, margin, ageHours, appendCsv } = require_util();
    var FomoScanner = class {
      constructor(page, cfg) {
        this.page = page;
        this.cfg = cfg;
        this.sel = cfg.selectors;
        this.out = cfg.output;
        this.needOpen = true;
        this.sinceOpen = 0;
        this.resumeK = 1;
        this.adDone = /* @__PURE__ */ new Set();
        this.failMap = {};
        this.pageFail = 0;
        this.total = 0;
        this.iter = 0;
        this.stopped = false;
      }
      // sleep yang berhenti lebih awal kalau run dihentikan (jadwal berikutnya / Ctrl+C)
      async wait(ms) {
        const end = Date.now() + ms;
        while (!this.stopped && Date.now() < end) await sleep(Math.min(500, end - Date.now()));
      }
      x(q) {
        return this.page.locator(`xpath=${q}`);
      }
      rowLoc(k) {
        return this.x(`${this.sel.row}[${k}]`);
      }
      async text(locator, timeout) {
        try {
          return (await locator.first().textContent({ timeout }) || "").replace(/\s+/g, " ").trim();
        } catch {
          return null;
        }
      }
      tpFor(name) {
        const v = this.cfg.tpMap[name.toLowerCase()];
        return Number.isFinite(v) ? v : Number(this.cfg.tp);
      }
      async openProfile() {
        await this.page.goto(this.cfg.profileUrl, { waitUntil: "domcontentloaded" });
        await sleep(this.cfg.wait.profileLoadMs);
        this.needOpen = false;
        this.sinceOpen = 0;
      }
      // Scroll sampai jumlah baris tidak bertambah (maks 8 kali). Return null kalau halaman bermasalah.
      async loadAllRows() {
        const rows = this.x(this.sel.row);
        let cnt;
        try {
          cnt = await rows.count();
        } catch {
          return null;
        }
        let last = -1;
        for (let sc = 0; sc < 8 && cnt !== last; sc++) {
          last = cnt;
          if (cnt > 0) {
            await this.rowLoc(cnt).scrollIntoViewIfNeeded({ timeout: 3e3 }).catch(() => {
            });
            await this.page.keyboard.press("End").catch(() => {
            });
          }
          await sleep(1500);
          cnt = await rows.count().catch(() => cnt);
        }
        return cnt;
      }
      // Klik icon coin di baris k, dicoba clickTries kali
      async clickRowIcon(k, name) {
        for (let t = 1; t <= this.cfg.clickTries; t++) {
          try {
            await this.rowLoc(k).locator("xpath=.//img").first().click({ timeout: this.cfg.wait.clickTimeoutMs });
            return true;
          } catch {
            log(`Klik icon ${name} gagal, coba lagi... (${t}/${this.cfg.clickTries})`, "warn");
            await sleep(1500);
          }
        }
        return false;
      }
      markFail(name, ok) {
        const key = name.toLowerCase();
        this.failMap[key] = ok ? 0 : (this.failMap[key] || 0) + 1;
      }
      logSell(ts, name, nominal, pct, result) {
        appendCsv(this.out.dir, this.out.sellLogFile, [ts, name, nominal, pct, result]);
      }
      // ---------- SELL ----------
      async doSell(k, ts, name, nominal, pct, tp) {
        const W = this.cfg.wait;
        log(`SELL: ${name} (${pct}% >= TP ${tp}%)`, "ok");
        this.needOpen = true;
        if (!await this.clickRowIcon(k, name)) {
          log(`COIN TIDAK BISA DIKLIK: ${name}. Dilewati`, "err");
          this.markFail(name, false);
          this.logSell(ts, name, nominal, pct, "CLICK_GAGAL");
          this.resumeK = k + 1;
          return;
        }
        this.markFail(name, true);
        let flowOk = true;
        let finalText = null;
        try {
          await sleep(W.popupMs);
          await this.x(this.sel.sellButton).first().click({ timeout: W.elementTimeoutMs });
          await sleep(500);
          await this.x(this.sel.sell100).first().click({ timeout: W.elementTimeoutMs });
          await sleep(500);
          finalText = await this.text(this.x(this.sel.sellConfirm), W.elementTimeoutMs);
        } catch {
          flowOk = false;
        }
        if (!(flowOk && finalText === `Sell ${name}`)) {
          log(`Coin di popup tidak cocok (${finalText}), sell dibatalkan`, "err");
          this.logSell(ts, name, nominal, pct, "MISMATCH");
          this.resumeK = k + 1;
          return;
        }
        if (this.cfg.dryRunSell) {
          log(`DRY RUN: berhenti sebelum klik '${finalText}'`, "warn");
          this.logSell(ts, name, nominal, pct, "DRY_RUN_STOP");
          this.resumeK = k + 1;
          return;
        }
        let clicked = true;
        try {
          await this.x(this.sel.sellConfirm).first().click({ timeout: W.elementTimeoutMs });
        } catch {
          clicked = false;
        }
        await sleep(W.afterActionMs);
        if (clicked) {
          log(`SOLD: ${name} (${pct}%)`, "ok");
          this.logSell(ts, name, nominal, pct, "SOLD");
          this.resumeK = k;
        } else {
          log(`SELL GAGAL: ${name} (tombol konfirmasi tidak bisa diklik)`, "err");
          this.logSell(ts, name, nominal, pct, "SELL_GAGAL");
          this.resumeK = k + 1;
        }
      }
      // ---------- AD (average down) ----------
      async readRsi() {
        const W = this.cfg.wait;
        const frame = this.page.frameLocator(this.sel.rsiFrame).first();
        for (let t = 0; t < W.rsiTries; t++) {
          const txt = await this.text(frame.locator(`xpath=${this.sel.rsiValue}`), W.rsiTimeoutMs);
          const n = parseFloat(txt);
          if (Number.isFinite(n)) return n;
          await sleep(1e3);
        }
        return -1;
      }
      async doAd(k, ts, name, pct) {
        const W = this.cfg.wait;
        const d = { ageH: -1, mcNow: -1, avgMC: -1, invested: -1, rsi: -1, result: "POPUP_MISMATCH" };
        log(`KANDIDAT AD: ${name} (${pct}%) -> cek detail coin`, "warn");
        if (!await this.clickRowIcon(k, name)) {
          log(`COIN TIDAK BISA DIKLIK: ${name}. AD dibatalkan`, "err");
          this.markFail(name, false);
          d.result = "CLICK_GAGAL";
        } else {
          this.markFail(name, true);
          await sleep(W.popupMs);
          const popName = await this.text(this.x(this.sel.popupName), W.elementTimeoutMs);
          if (popName !== name) {
            log(`Popup coin tidak cocok (${popName}), AD dibatalkan`, "err");
          } else {
            try {
              await this.x(this.sel.popupIcon).first().click({ timeout: W.elementTimeoutMs });
            } catch {
            }
            await sleep(W.detailMs);
            await this.x(this.sel.detailMarketCap).first().waitFor({ timeout: W.elementTimeoutMs }).catch(() => {
            });
            d.ageH = ageHours(await this.text(this.x(this.sel.detailAge), 3e3));
            d.mcNow = money(await this.text(this.x(this.sel.detailMarketCap), 3e3));
            d.invested = money(await this.text(this.x(this.sel.detailInvested), 3e3));
            d.avgMC = money(await this.text(this.x(this.sel.detailAvgEntry), 3e3));
            if (this.cfg.adUseRsi) d.rsi = await this.readRsi();
            const fail = [];
            if (!(d.ageH >= this.cfg.adMinAgeH)) fail.push("UMUR");
            if (this.cfg.adUseRsi && !(d.rsi >= 0 && d.rsi <= this.cfg.adRsiMax)) fail.push("RSI");
            if (!(d.mcNow > 0 && d.avgMC > 0 && d.mcNow < d.avgMC)) fail.push("MC");
            if (!(d.invested > 0)) fail.push("INVESTED");
            d.result = fail.length ? `TIDAK_LOLOS:${fail.join("+")}` : "LOLOS";
            log(`AD CEK ${name}: umur=${d.ageH}h (min ${this.cfg.adMinAgeH}) | RSI=${d.rsi} (maks ${this.cfg.adRsiMax}) | MC=${d.mcNow} vs avg=${d.avgMC} | invested=${d.invested} | hasil=${d.result}`, "warn");
            if (d.result === "LOLOS") {
              await this.buyAd(name, d);
            } else {
              log(`AD ${name} belum memenuhi syarat, dicek lagi di putaran berikutnya`, "warn");
            }
          }
        }
        appendCsv(this.out.dir, this.out.adLogFile, [ts, name, d.ageH, d.rsi, d.mcNow, d.avgMC, d.invested, d.result]);
        await this.openProfile().catch(() => {
          this.needOpen = true;
        });
        this.resumeK = k + 1;
      }
      async buyAd(name, d) {
        const W = this.cfg.wait;
        let buyText = null;
        let flowOk = true;
        try {
          await this.x(this.sel.buyInput).first().fill(String(d.invested), { timeout: W.elementTimeoutMs });
          await sleep(1e3);
          buyText = await this.text(this.x(this.sel.buyButton), W.elementTimeoutMs);
        } catch {
          flowOk = false;
        }
        if (!(flowOk && buyText === `Buy ${name}`)) {
          log(`Tombol buy tidak cocok (${buyText}), AD dibatalkan`, "err");
          d.result = "BUY_MISMATCH";
          return;
        }
        if (this.cfg.dryRunAd) {
          log(`DRY RUN: berhenti sebelum klik '${buyText}' (nominal ${d.invested})`, "warn");
          d.result = "DRY_RUN_STOP";
          return;
        }
        try {
          await this.x(this.sel.buyButton).first().click({ timeout: W.elementTimeoutMs });
          await sleep(W.afterActionMs);
          log(`AD BUY: ${name} senilai $${d.invested}`, "ok");
          d.result = "BOUGHT";
          this.adDone.add(name);
        } catch {
          await sleep(W.afterActionMs);
          log(`BUY GAGAL: ${name} (tombol Buy tidak bisa diklik)`, "err");
          d.result = "BUY_GAGAL";
        }
      }
      // ---------- Satu siklus ----------
      async cycle() {
        this.total++;
        log(`=== Siklus #${this.total} | ${this.iter}/${this.cfg.maxLoop || "\u221E"} ===`);
        if (this.sinceOpen >= this.cfg.reloadEvery) this.needOpen = true;
        try {
          if (this.needOpen) {
            await this.openProfile();
          } else {
            log("Tidak pindah halaman, scan ulang di halaman yang sama");
            this.sinceOpen++;
          }
        } catch (e) {
          log(`Gagal membuka profil: ${e.message}`, "err");
        }
        const n = await this.loadAllRows();
        if (n === null) {
          this.pageFail++;
          log(`HALAMAN FOMO BERMASALAH. Kegagalan berturut-turut: ${this.pageFail}. Menunggu ${this.cfg.errPauseMs} ms lalu memuat ulang profil`, "err");
          this.needOpen = true;
          await this.wait(this.cfg.errPauseMs);
          return;
        }
        this.pageFail = 0;
        log(`${n} posisi terbaca`);
        if (n === 0) {
          log("0 posisi terbaca, profil dimuat ulang di siklus berikutnya", "warn");
          this.needOpen = true;
        }
        log(`Scan mulai dari coin ke-${this.resumeK}`);
        let acted = false;
        for (let k = this.resumeK; k <= n && !acted && !this.stopped; k++) {
          const row = this.rowLoc(k);
          const name = await this.text(row.locator(`xpath=${this.sel.rowName}`), 3e3);
          if (!name) {
            log(`Gagal membaca nama coin ke-${k}. Profil dimuat ulang, scan lanjut ke coin berikutnya`, "err");
            this.needOpen = true;
            acted = true;
            this.resumeK = k + 1;
            break;
          }
          const key = name.toLowerCase();
          if (this.cfg.excludeSet.has(key) || (this.failMap[key] || 0) >= this.cfg.clickFailMax) {
            log(`SKIP: ${name} (ada di exclude atau gagal diklik >= ${this.cfg.clickFailMax} kali)`);
            continue;
          }
          const colText = await this.text(row.locator(`xpath=${this.sel.rowValue}`), 3e3);
          if (colText === null) {
            log(`Gagal membaca margin coin ke-${k}. Profil dimuat ulang, scan lanjut ke coin berikutnya`, "err");
            this.needOpen = true;
            acted = true;
            this.resumeK = k + 1;
            break;
          }
          const nominal = money(colText);
          const pct = margin(colText);
          const tp = this.tpFor(name);
          const ts = nowTs();
          log(`${name} | $${nominal} | ${pct}% | TP ${tp}%`, "ok");
          appendCsv(this.out.dir, this.out.positionsFile, [ts, name, nominal, pct]);
          if (pct >= tp) {
            acted = true;
            await this.doSell(k, ts, name, nominal, pct, tp);
          } else if (pct <= this.cfg.adTrigger) {
            if (this.adDone.has(name)) {
              log(`Kandidat AD ${name} (${pct}%) dilewati: sudah pernah di-AD pada run ini`, "warn");
            } else {
              acted = true;
              await this.doAd(k, ts, name, pct);
            }
          }
        }
        if (!acted) {
          log("Tidak ada aksi di scan ini", "ok");
          this.resumeK = 1;
          await this.wait(this.cfg.scanIntervalMs);
        }
        this.iter++;
      }
      async run() {
        while (!this.stopped && (this.cfg.maxLoop === 0 || this.iter < this.cfg.maxLoop)) {
          try {
            await this.cycle();
          } catch (e) {
            log(`Error siklus: ${e.message}`, "err");
            this.needOpen = true;
            await this.wait(5e3);
          }
        }
        log(`Run selesai (${this.total} siklus)`, "ok");
      }
    };
    module2.exports = { FomoScanner };
  }
});

// pw/run.js
var require_run = __commonJS({
  "pw/run.js"() {
    var cron = require_node_cron();
    var { loadPwConfig } = require_config();
    var { openBrowser } = require_browser();
    var { FomoScanner } = require_scanner();
    var { log, sleep } = require_util();
    var cfg = loadPwConfig();
    var context = null;
    var page = null;
    var scanner = null;
    var runPromise = null;
    var closing = false;
    var busy = false;
    async function ensureBrowser() {
      if (context) return;
      context = await openBrowser(cfg);
      page = context.pages()[0] || await context.newPage();
      context.on("close", () => {
        context = null;
        page = null;
        if (closing) return;
        log("Browser tertutup tanpa diminta. Dibuka ulang di jadwal berikutnya" + (cfg.schedule ? "" : " (tanpa jadwal: bot berhenti, jalankan ulang npm run pw)"), "err");
        if (scanner) scanner.stopped = true;
        if (!cfg.schedule) process.exit(1);
      });
    }
    async function closeBrowser() {
      if (!context) return;
      closing = true;
      await context.close().catch(() => {
      });
      context = null;
      page = null;
      closing = false;
    }
    async function stopRun() {
      if (!scanner) return;
      scanner.stopped = true;
      if (runPromise) {
        log("Menunggu siklus yang sedang berjalan selesai...");
        await runPromise.catch(() => {
        });
      }
      scanner = null;
      runPromise = null;
    }
    async function startRun(reason) {
      if (busy) {
        log(`[${reason}] Pergantian run sebelumnya belum selesai, jadwal ini dilewati`, "warn");
        return;
      }
      busy = true;
      try {
        log(`[${reason}] >>> MULAI RUN FOMO SCANNER <<<`, "ok");
        await stopRun();
        if (cfg.restartBrowser && context) {
          await closeBrowser();
          log("Chrome lama ditutup");
          await sleep(cfg.restartWaitMs);
        }
        await ensureBrowser();
        scanner = new FomoScanner(page, cfg);
        const current = scanner;
        runPromise = current.run().catch((e) => log(`Run berhenti karena error: ${e.message}`, "err"));
      } catch (e) {
        log(`Gagal memulai run: ${e.message}`, "err");
      } finally {
        busy = false;
      }
    }
    async function shutdown() {
      log("Menghentikan bot...");
      if (scanner) scanner.stopped = true;
      await closeBrowser();
      process.exit(0);
    }
    (async () => {
      console.log("=".repeat(56));
      console.log("\u2705 FOMO SCANNER (Playwright) AKTIF");
      console.log(`   Profil fomo : ${cfg.profileUrl}`);
      console.log(`   Jadwal      : ${cfg.schedule || "tanpa jadwal (jalan terus)"} | zona ${cfg.timezone}`);
      console.log(`   Run saat start: ${cfg.runOnStart ? "ya" : "tidak"} | restart Chrome tiap jadwal: ${cfg.restartBrowser ? "ya" : "tidak"}`);
      console.log(`   Chrome      : ${cfg.browser.userDataDir} (headless: ${cfg.browser.headless ? "ya" : "tidak"})`);
      console.log(`   Sell        : TP ${cfg.tp}%${Object.keys(cfg.tpMap).length ? ` | custom ${JSON.stringify(cfg.tpCustom)}` : ""} | ${cfg.dryRunSell ? "DRY RUN" : "JUAL BENERAN"}`);
      console.log(`   AD          : margin <= ${cfg.adTrigger}% | umur >= ${cfg.adMinAgeH}h | RSI ${cfg.adUseRsi ? `<= ${cfg.adRsiMax}` : "tidak dipakai"} | ${cfg.dryRunAd ? "DRY RUN" : "BELI BENERAN"}`);
      console.log(`   Exclude     : ${cfg.exclude.length ? cfg.exclude.join(", ") : "-"}`);
      console.log(`   Output      : ${cfg.output.dir}`);
      console.log("=".repeat(56));
      process.on("SIGINT", shutdown);
      process.on("SIGTERM", shutdown);
      if (cfg.schedule) {
        if (!cron.validate(cfg.schedule)) {
          console.error(`Format cron tidak valid: "${cfg.schedule}"`);
          process.exit(1);
        }
        cron.schedule(cfg.schedule, () => startRun("JADWAL"), { timezone: cfg.timezone });
        if (cfg.runOnStart) await startRun("STARTUP");
        else log(`Menunggu jadwal pertama (${cfg.schedule})`);
      } else {
        await startRun("STARTUP");
        await runPromise;
        await closeBrowser();
        process.exit(0);
      }
    })().catch((e) => {
      console.error("Gagal start:", e);
      process.exit(1);
    });
  }
});

// pw/index.js
if (process.argv.slice(2).includes("login")) {
  require_login();
} else {
  require_run();
}
