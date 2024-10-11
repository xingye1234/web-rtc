import { useEffect, useRef, useState } from "react";
import { peer } from "@web/rtc";
import { Button, Input, message } from "antd";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";

enum MessageType {
  LOCAL = "local",
  REMOTE = "remote",
}

interface IMessage {
  type: MessageType;
  data: any;
}

export default function WebRtc() {
  const conn = useRef<any>();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [localId, setLocalId] = useState<string>("");
  const [remoteId, setRemoteId] = useState<string>("");
  const [messages, setMessages] = useState<string>("");
  const [messageList, setMessageList] = useState<IMessage[]>([]);

  const initPeer = () => {
    peer!.on("open", (id) => {
      setLocalId(id);
    });
    peer!.on("connection", (connection) => {
      connection.on("data", (data: any) => {
        setMessageList((prev) => [...prev, { type: MessageType.REMOTE, data }]);
      });
    });
  };

  const connectPeer = () => {
    conn.current = peer!.connect(remoteId);
    conn.current.on("open", () => {
      message.success("连接成功");
    });
  };

  const handleConnectPeer = () => {
    if (!remoteId) {
      message.error("请输入远程ID");
      return;
    }

    connectPeer();
  };

  const handleSendMessage = () => {
    if (!messages) {
      message.error("请输入消息内容");
      return;
    }
    setMessageList((prev) => [
      ...prev,
      { type: MessageType.LOCAL, data: messages },
    ]);
    conn.current.send(messages);

    setMessages("");
  };

  useEffect(() => {
    initPeer();
  }, []);

  useEffect(() => {
    let timer = setTimeout(() => {
      scrollRef.current?.querySelector("#scroll-area")?.scrollTo({
        top: scrollRef.current?.querySelector("#scroll-area")?.scrollHeight,
        behavior: "smooth",
      });
    }, 150);

    return () => {
      clearTimeout(timer);
    };
  }, [messageList]);

  return (
    <div className="w-[48rem] h-96 rounded-lg mx-auto">
      本地ID:
      <span className="ml-2">
        {localId ? (
          localId
        ) : (
          <span className="animate-loadings">loading...</span>
        )}
        {/* <span className="animate-loadings">loading...</span> */}
      </span>
      <div className="flex mt-4 gap-x-2">
        <span>远程ID:</span>
        <Input
          className="w-96"
          value={remoteId}
          onChange={(e) => setRemoteId(e.target.value)}
        />
        <Button type="primary" onClick={handleConnectPeer}>
          连接
        </Button>
      </div>
      <div className="mt-4">
        <ScrollArea
          ref={scrollRef}
          className="h-[24rem] w-full rounded-md border p-4"
        >
          {messageList.map((m, idx) => {
            return (
              <div
                key={idx}
                className={cn(
                  "flex w-full items-center gap-x-2 rounded-md p-2",
                  m.type === MessageType.LOCAL ? "justify-end" : ""
                )}
              >
                {m.type === MessageType.LOCAL ? (
                  <>
                    <span className="mr-1 bg-green-500 p-2 rounded-md text-white">
                      {m.data}
                    </span>
                    <span
                      className={cn(
                        "p-2 rounded-md min-w-10 text-center text-white bg-slate-400"
                      )}
                    >
                      {/* {m.type === MessageType.LOCAL ? "我" : "对方"} */}我
                    </span>
                  </>
                ) : (
                  <>
                    <span
                      className={cn(
                        "p-2 rounded-md min-w-10 text-center text-white bg-slate-400"
                      )}
                    >
                      {/* {m.type === MessageType.LOCAL ? "我" : "对方"} */}
                      {"对方".slice(0, 1)}
                    </span>
                    <span className="mr-1 bg-green-500 p-2 rounded-md text-white">
                      {m.data}
                    </span>
                  </>
                )}
              </div>
            );
          })}
        </ScrollArea>
      </div>
      <div className="flex mt-4 gap-x-2">
        <Input
          className="w-96"
          value={messages}
          onChange={(e) => setMessages(e.target.value)}
        />
        <Button type="primary" onClick={handleSendMessage}>
          发送
        </Button>
      </div>
    </div>
  );
}
