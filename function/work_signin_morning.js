/**
 * 签到任务-上班签到
 * 
 * 功能：上班打卡提醒/执行
 * Cron: 31 8 * * *
 */
const $ = API("签到任务-上班签到");

const KEY_IS_WORKDAY = "work_signin_is_workday";
const KEY_IS_LEAVE = "work_signin_is_leave";
const KEY_MORNING_DONE = "work_signin_morning_done";
const KEY_QYWX_KEY = "work_signin_qywx_key";

(async () => {
    try {
        const isManual = typeof $request !== "undefined";
        $.info(`开始执行上班签到... 模式: ${isManual ? "手动触发" : "自动定时"}`);

        if (!isManual) {
            // 1. 检查是否请假
            const isLeave = $.read(KEY_IS_LEAVE) === "true";
            if (isLeave) {
                $.info("今日已设置请假，跳过签到");
                return;
            }

            // 2. 检查是否为工作日
            const isWorkDay = $.read(KEY_IS_WORKDAY) === "true";
            if (!isWorkDay) {
                $.info("今日非工作日，跳过签到");
                return;
            }

            // 3. 检查是否已签到
            const isDone = $.read(KEY_MORNING_DONE) === "true";
            if (isDone) {
                $.info("今日上班已签到，跳过");
                return;
            }
            
            // 随机睡眠 0-10 秒
            const sleepTime = Math.floor(Math.random() * 12000);
            $.info(`随机等待 ${sleepTime/1000} 秒...`);
            await sleep(sleepTime);
        } else {
            $.info("手动模式：跳过检查和等待，立即执行");
        }

        // 4. 执行签到
        $.info("准备执行上班签到...");

        // 发送消息
        await sendSignInMessage("上班签到", "✅ 上班打卡成功！\n祝你今天工作愉快！");

        // 5. 更新状态
        $.write("true", KEY_MORNING_DONE);
        $.info("状态已更新：上班签到完成");

        if (isManual) {
            $.done({ response: { status: 200, headers: { "Content-Type": "text/plain;charset=utf-8" }, body: "✅ 上班签到执行成功" } });
        }

    } catch (e) {
        $.error(`❌ 错误: ${e.message}`);
        $.notify($.name, "运行出错", e.message);
        if (typeof $request !== "undefined") {
            $.done({ response: { status: 500, headers: { "Content-Type": "text/plain;charset=utf-8" }, body: `❌ 执行失败: ${e.message}` } });
        }
    } finally {
        if (typeof $request === "undefined") {
            $.done();
        }
    }
})();

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendSignInMessage(title, content) {
    const webhookKey = $.read(KEY_QYWX_KEY);
    if (!webhookKey) {
        throw new Error("未配置企业微信 Key (work_signin_qywx_key)");
    }

    const url = `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${webhookKey}`;
    const body = {
        msgtype: "markdown",
        markdown: {
            content: `### ${title}\n------------------------\n${content}\n\n时间: ${new Date().toLocaleString()}`
        }
    };

    try {
        const response = await $.http.post({
            url,
            body: JSON.stringify(body),
            headers: { "Content-Type": "application/json" }
        });
        const data = response.body;

        try {
            const res = JSON.parse(data);
            if (res.errcode === 0) {
                $.info("企业微信消息发送成功");
                $.notify($.name, title, "消息已推送");
                return res;
            } else {
                throw new Error(`发送失败: [${res.errcode}] ${res.errmsg}`);
            }
        } catch (e) {
            throw new Error(`解析响应失败: ${e.message}`);
        }
    } catch (error) {
        throw new Error(`请求失败: ${error}`);
    }
}

// Env Helper (Loon Only)
function ENV() { const e = "undefined" != typeof $task, t = "undefined" != typeof $loon, s = "undefined" != typeof $httpClient && !t, i = "function" == typeof require && "undefined" != typeof $jsbox; return { isQX: e, isLoon: t, isSurge: s, isNode: "function" == typeof require && !i, isJSBox: i, isRequest: "undefined" != typeof $request, isScriptable: "undefined" != typeof importModule } } function HTTP(e = { baseURL: "" }) { const { isQX: t, isLoon: s, isSurge: i, isScriptable: n, isNode: o } = ENV(), r = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/\/=]*)/; const u = {}; return ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS", "PATCH"].forEach(l => u[l.toLowerCase()] = (u => (function (u, l) { l = "string" == typeof l ? { url: l } : l; const h = e.baseURL; h && !r.test(l.url || "") && (l.url = h ? h + l.url : l.url); const a = (l = { ...e, ...l }).timeout, c = { onRequest: () => { }, onResponse: e => e, onTimeout: () => { }, ...l.events }; let f, d; if (c.onRequest(u, l), t) f = $task.fetch({ method: u, ...l }); else if (s || i || o) f = new Promise((e, t) => { (o ? require("request") : $httpClient)[u.toLowerCase()](l, (s, i, n) => { s ? t(s) : e({ statusCode: i.status || i.statusCode, headers: i.headers, body: n }) }) }); else if (n) { const e = new Request(l.url); e.method = u, e.headers = l.headers, e.body = l.body, f = new Promise((t, s) => { e.loadString().then(s => { t({ statusCode: e.response.statusCode, headers: e.response.headers, body: s }) }).catch(e => s(e)) }) } const p = a ? new Promise((e, t) => { d = setTimeout(() => (c.onTimeout(), t(`${u} URL: ${l.url} exceeds the timeout ${a} ms`)), a) }) : null; return (p ? Promise.race([p, f]).then(e => (clearTimeout(d), e)) : f).then(e => c.onResponse(e)) })(l, u))), u } function API(e = "untitled", t = !1) { const { isQX: s, isLoon: i, isSurge: n, isNode: o, isJSBox: r, isScriptable: u } = ENV(); return new class { constructor(e, t) { this.name = e, this.debug = t, this.http = HTTP(), this.env = ENV(), this.node = (() => { if (o) { return { fs: require("fs") } } return null })(), this.initCache(); Promise.prototype.delay = function (e) { return this.then(function (t) { return ((e, t) => new Promise(function (s) { setTimeout(s.bind(null, t), e) }))(e, t) }) } } initCache() { if (s && (this.cache = JSON.parse($prefs.valueForKey(this.name) || "{}")), (i || n) && (this.cache = JSON.parse($persistentStore.read(this.name) || "{}")), o) { let e = "root.json"; this.node.fs.existsSync(e) || this.node.fs.writeFileSync(e, JSON.stringify({}), { flag: "wx" }, e => console.log(e)), this.root = {}, e = `${this.name}.json`, this.node.fs.existsSync(e) ? this.cache = JSON.parse(this.node.fs.readFileSync(`${this.name}.json`)) : (this.node.fs.writeFileSync(e, JSON.stringify({}), { flag: "wx" }, e => console.log(e)), this.cache = {}) } } persistCache() { const e = JSON.stringify(this.cache, null, 2); s && $prefs.setValueForKey(e, this.name), (i || n) && $persistentStore.write(e, this.name), o && (this.node.fs.writeFileSync(`${this.name}.json`, e, { flag: "w" }, e => console.log(e)), this.node.fs.writeFileSync("root.json", JSON.stringify(this.root, null, 2), { flag: "w" }, e => console.log(e))) } write(e, t) { if (this.log(`SET ${t}`), -1 !== t.indexOf("#")) { if (t = t.substr(1), n || i) return $persistentStore.write(e, t); if (s) return $prefs.setValueForKey(e, t); o && (this.root[t] = e) } else this.cache[t] = e; this.persistCache() } read(e) { return this.log(`READ ${e}`), -1 === e.indexOf("#") ? this.cache[e] : (e = e.substr(1), n || i ? $persistentStore.read(e) : s ? $prefs.valueForKey(e) : o ? this.root[e] : void 0) } delete(e) { if (this.log(`DELETE ${e}`), -1 !== e.indexOf("#")) { if (e = e.substr(1), n || i) return $persistentStore.write(null, e); if (s) return $prefs.removeValueForKey(e); o && delete this.root[e] } else delete this.cache[e]; this.persistCache() } notify(e, t = "", l = "", h = {}) { const a = h["open-url"], c = h["media-url"]; if (s && $notify(e, t, l, h), n && $notification.post(e, t, l + `${c ? "\n多媒体:" + c : ""}`, { url: a }), i) { let s = {}; a && (s.openUrl = a), c && (s.mediaUrl = c), "{}" === JSON.stringify(s) ? $notification.post(e, t, l) : $notification.post(e, t, l, s) } if (o || u) { const s = l + (a ? `\n点击跳转: ${a}` : "") + (c ? `\n多媒体: ${c}` : ""); if (r) { require("push").schedule({ title: e, body: (t ? t + "\n" : "") + s }) } else console.log(`${e}\n${t}\n${s}\n\n`) } } log(e) { this.debug && console.log(`[${this.name}] LOG: ${this.stringify(e)}`) } info(e) { console.log(`[${this.name}] INFO: ${this.stringify(e)}`) } error(e) { console.log(`[${this.name}] ERROR: ${this.stringify(e)}`) } wait(e) { return new Promise(t => setTimeout(t, e)) } done(e = {}) { s || i || n ? $done(e) : o && !r && "undefined" != typeof $context && ($context.headers = e.headers, $context.statusCode = e.statusCode, $context.body = e.body) } stringify(e) { if ("string" == typeof e || e instanceof String) return e; try { return JSON.stringify(e, null, 2) } catch (e) { return "[object Object]" } } }(e, t) }