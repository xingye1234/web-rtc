import { cn } from "@/lib/utils";
import { peer } from "@web/rtc";
import { Button, Input, message } from "antd";
import { Download, File, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "./ui/scroll-area";

enum MessageType {
  LOCAL = "local",
  REMOTE = "remote",
}

interface IMessage {
  type: MessageType;
  data: any;
  file?: File;
  src?: string | any;
  fileType?: string;
}

function handleFile(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.readAsDataURL(file);
  });
}

export default function WebRtc() {
  const peerRef = useRef<any>(peer);
  //对话链接
  const conn = useRef<any>();
  // 视频连接
  const currentCallRef = useRef<any>();

  //信息载体
  const messageWrap = useRef<IMessage>();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [localId, setLocalId] = useState<string>("");
  const [remoteId, setRemoteId] = useState<string>("");

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [messages, setMessages] = useState<string>("");
  const [messageList, setMessageList] = useState<IMessage[]>([]);

  const initPeer = () => {
    peerRef.current!.on("open", (id: any) => {
      setLocalId(id);
    });
    peerRef.current!.on("connection", (connection: any) => {
      connection.on("data", (data: any) => {
        /**
         * TODO:将Uint8Array文件数据转成Blob数据对象
         */

        setMessageList((prev) => [
          ...prev,
          {
            ...data,
            type: MessageType.REMOTE,
            file: new Blob([data.file], { type: data.fileType }),
          },
        ]);
      });
    });

    peerRef.current!.on("call", async (call: any) => {
      if (window.confirm(`是否接受 ${call.peer}?`)) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localVideoRef.current!.srcObject = stream;
        localVideoRef.current!.play();

        call.answer(stream);

        currentCallRef.current = call;

        call.on("stream", (stream: any) => {
          remoteVideoRef.current!.srcObject = stream;
          remoteVideoRef.current!.play();
        });
      }
    });
  };

  const connectPeer = () => {
    conn.current = peerRef.current!.connect(remoteId);
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
    setMessageList((prev) => [...prev, messageWrap.current!]);
    // console.log("messageWrap.current:", messageWrap.current);
    conn.current.send(messageWrap.current!);
    setMessages("");
  };

  const endCall = () => {
    if (currentCallRef.current) {
      currentCallRef.current.close();
    }
  };

  //视频通话
  const handleCallVideo = async () => {
    if (!remoteId) {
      message.error("请输入远程ID");
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localVideoRef.current!.srcObject = stream;
    localVideoRef.current!.play();
    handleConnectPeer();

    const call = peerRef.current!.call(remoteId, stream);
    call.on("stream", (stream: any) => {
      remoteVideoRef.current!.srcObject = stream;
      remoteVideoRef.current!.play();
    });
    call.on("error", (err: any) => {
      console.error(err);
    });
    call.on("close", () => {
      endCall();
    });

    currentCallRef.current!.on("stream", (stream: any) => {
      remoteVideoRef.current!.srcObject = stream;
      remoteVideoRef.current!.play();
    });
  };

  const handleMessges = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessages(e.target.value);
    messageWrap.current = {
      type: MessageType.LOCAL,
      data: e.target.value,
    };
  };

  //处理文件发送
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files![0];
    setMessages(() => file.name);
    const isImg = file.type.includes("image");
    const imgSrc = await handleFile(file);

    messageWrap.current = {
      type: MessageType.LOCAL,
      data: file.name,
      file: file, //new Blob([file], { type: file.type })
      fileType: file.type,
      src: isImg ? imgSrc : null,
    };
  };

  const handleClickFile = (raw: IMessage) => {
    const url = URL.createObjectURL(raw.file!);
    window.open(url);
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
          placeholder="请输入远程连接用户ID"
          onChange={(e) => setRemoteId(() => e.target.value)}
        />
        <Button type="primary" onClick={handleConnectPeer}>
          连接
        </Button>
      </div>
      <div className="flex mt-4 flex-col">
        <div className="flex gap-x-2">
          <Button type="primary" onClick={handleCallVideo}>
            视频通话
          </Button>
          <Button variant="solid" color="danger" onClick={endCall}>
            结束通话
          </Button>
        </div>

        <div className="w-full flex gap-x-2 mt-4">
          <video
            className="w-1/2 h-48"
            ref={localVideoRef}
            autoPlay
            controls
          ></video>
          <video
            className="w-1/2 h-48"
            ref={remoteVideoRef}
            autoPlay
            controls
          ></video>
        </div>
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
                    {m.data && !m.file ? (
                      <span className="mr-1 bg-green-500 p-2 rounded-md text-white">
                        {m.data}
                      </span>
                    ) : (
                      <span className="mr-1 bg-slate-400 p-2 rounded-md text-white">
                        {m.fileType?.includes("image") ? (
                          <img
                            src={m.src}
                            className="max-w-[10rem] max-h-[10rem] object-contain"
                          />
                        ) : (
                          m.data
                        )}
                      </span>
                    )}

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
                      {"对方".slice(0, 1)}
                    </span>
                    {m.data && !m.file ? (
                      <span className="mr-1 bg-green-500 p-2 rounded-md text-white">
                        {m.data}
                      </span>
                    ) : (
                      <span className="mr-1 bg-slate-400 p-2 rounded-md text-white">
                        {m.fileType?.includes("image") ? (
                          <img
                            src={m.src}
                            className="max-w-[10rem] max-h-[10rem] object-contain"
                          />
                        ) : (
                          <>
                            <div
                              className="h-full flex flex-col items-center cursor-pointer relative"
                              onClick={() => handleClickFile(m)}
                            >
                              <File className="w-10 h-10"></File>
                              <Download className="w-5 h-5 mt-1 absolute bottom-7 left-8"></Download>
                              <span className="text-sm">{m.data}</span>
                            </div>
                          </>
                        )}
                      </span>
                    )}
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
          onChange={(e) => handleMessges(e)}
        />
        <Button type="primary" onClick={handleSendMessage}>
          发送
        </Button>
        <div className="flex relative w-8 h-8">
          <input
            type="file"
            className="opacity-0 w-full"
            onChange={(e) => handleFileChange(e)}
          />
          <Plus className="absolute top-0 left-0 w-8 h-8 cursor-pointer pointer-events-none"></Plus>
        </div>
      </div>
    </div>
  );
}
