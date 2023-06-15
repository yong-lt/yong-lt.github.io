(function () {
    const Barrage = class {
        wsurl = "ws://127.0.0.1:9527";
        timer = null;
        timeinterval = 10 * 1000; // 断线重连轮询间隔
        propsId = null;
        chatDom = null;
        ws = null;
        observer = null;
        chatObserverrom = null;
        option = {};
        event = {};
        eventRegirst = {};
        constructor(option = { message: true }) {
            this.option = option;
            let { link, removePlay } = option;
            if (link) {
                this.wsurl = link;
            }
            if (removePlay) {
                document.querySelector(".basicPlayer").remove();
            }
            this.propsId = Object.keys(document.querySelector(".webcast-chatroom___list"))[1];
            this.chatDom = document.querySelector(".webcast-chatroom___items").children[0];
            this.ws = new WebSocket(this.wsurl);
            this.ws.onclose = this.wsClose;
            this.ws.onopen = () => {
                this.openWs();
            };
        }

        // 消息事件 , join, message
        on(e, cb) {
            this.eventRegirst[e] = true;
            this.event[e] = cb;
        }
        openWs() {
            console.log(`[${new Date().toLocaleTimeString()}]`, "服务已经连接成功!");
            clearInterval(this.timer);
            this.runServer();
        }
        wsClose() {
            console.log("服务器断开");
            if (this.timer !== null) {
                return;
            }
            this.observer && this.observer.disconnect();
            this.chatObserverrom && this.chatObserverrom.disconnect();
            this.timer = setInterval(() => {
                console.log("正在等待服务器启动..");
                this.ws = new WebSocket(wsurl);
                console.log("状态 ->", this.ws.readyState);
                setTimeout(() => {
                    if (this.ws.readyState === 1) {
                        openWs();
                    }
                }, 2000);
            }, this.timeinterval);
        }
        runServer() {
            let _this = this;
            this.chatObserverrom = new MutationObserver((mutationsList, observer) => {
                for (let mutation of mutationsList) {
                    if (mutation.type === "childList" && mutation.addedNodes.length) {
                        let b = mutation.addedNodes[0];
                        let message = this.messageParse(b);
                        if (message) {
                            this.ws.send(JSON.stringify(message));
                        }
                    }
                }
            });
            this.chatObserverrom.observe(this.chatDom, { childList: true });
        }
        getUser(user) {
            if (!user) {
                return;
            }
            let msg = {
                userID: user.id,
                nickName: user.nickname,
                isAdmin: user.userAttr.isAdmin,
                isFans: user.fansClub.data.level && userFansClubStatus,
                fansLevel: user.fansClub.data.level,
            };
            return msg;
        }
        messageParse(dom) {
            if (!dom[this.propsId].children.props.message) {
                return null;
            }
            let msg = dom[this.propsId].children.props.message.payload;
            let result = {};

            result = Object.assign(result, this.getUser(msg.user));

            switch (msg.common.method) {
                case "WebcastChatMessage":
                    result = Object.assign(result, {
                        msg_content: msg.content,
                    });
                    break;
                default:
                    result = Object.assign(result, {
                        msg_content: msg.content,
                    });
                    break;
            }
            return result;
        }
    };

    new Barrage();
})();
