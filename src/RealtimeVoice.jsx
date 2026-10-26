import React, { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Phone, PhoneOff, Volume2 } from "lucide-react";
import { getLanguage } from "./i18n/core";
export default function RealtimeVoice({ level, focus, configured }) {
  const en = getLanguage() === "en";
  const [state, setState] = useState("idle"),
    [muted, setMuted] = useState(false),
    [error, setError] = useState("");
  const pc = useRef(null),
    stream = useRef(null),
    audio = useRef(null),
    abort = useRef(null),
    timer = useRef(null),
    mounted = useRef(true),
    generation = useRef(0);
  const stop = () => {
    generation.current++;
    abort.current?.abort();
    clearTimeout(timer.current);
    pc.current?.close();
    pc.current = null;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    if (audio.current) {
      audio.current.pause();
      audio.current.srcObject = null;
    }
    if (mounted.current) {
      setState("idle");
      setMuted(false);
    }
  };
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      stop();
    };
  }, []);
  const start = async () => {
    const callId = ++generation.current;
    setError("");
    setState("connecting");
    try {
      if (!configured)
        throw new Error(
          en
            ? "Voice AI needs a configured service key."
            : "يلزم تفعيل خدمة الذكاء الاصطناعي الصوتية أولًا.",
        );
      if (!window.RTCPeerConnection || !navigator.mediaDevices?.getUserMedia)
        throw new Error(
          en
            ? "Use a supported browser over HTTPS."
            : "استخدم متصفحًا داعمًا عبر اتصال HTTPS.",
        );
      abort.current = new AbortController();
      const captured = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      if (
        !mounted.current ||
        callId !== generation.current ||
        abort.current.signal.aborted
      ) {
        captured.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = captured;
      const peer = new RTCPeerConnection();
      pc.current = peer;
      peer.ontrack = (e) => {
        if (audio.current)
          audio.current.srcObject = e.streams[0] || new MediaStream([e.track]);
      };
      stream.current
        .getTracks()
        .forEach((t) => peer.addTrack(t, stream.current));
      peer.onconnectionstatechange = () => {
        if (!mounted.current || callId !== generation.current) return;
        if (peer.connectionState === "connected") setState("connected");
        else if (["failed", "disconnected"].includes(peer.connectionState)) {
          stop();
          setError(
            en
              ? "The call disconnected. Try again."
              : "انقطع الاتصال. حاول مجددًا.",
          );
        }
      };
      const channel = peer.createDataChannel("oai-events");
      channel.onopen = () =>
        channel.send(
          JSON.stringify({
            type: "response.create",
            response: {
              instructions: en
                ? "Greet the learner and ask a short introductory question."
                : "رحب بالمتعلم واسأله سؤالًا قصيرًا لبدء تدريب الإنجليزية.",
            },
          }),
        );
      channel.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data);
          if (event.type === "error") {
            stop();
            setError(
              en
                ? "The voice session reported an error. Try again."
                : "واجهت الجلسة الصوتية خطأ. حاول مجددًا.",
            );
          }
        } catch {}
      };
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      const response = await fetch("/api/realtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abort.current.signal,
        body: JSON.stringify({
          sdp: offer.sdp,
          language: getLanguage(),
          level,
          focus,
        }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error || "Voice service unavailable");
      if (!mounted.current || abort.current.signal.aborted) return;
      await peer.setRemoteDescription({ type: "answer", sdp: body.sdp });
      timer.current = setTimeout(() => {
        stop();
        if (mounted.current)
          setError(
            en
              ? "The ten-minute session ended. You can start another."
              : "انتهت جلسة العشر دقائق. يمكنك بدء جلسة جديدة.",
          );
      }, 600000);
      await audio.current?.play().catch(() => {});
    } catch (e) {
      if (callId !== generation.current) return;
      stop();
      if (mounted.current && e.name !== "AbortError")
        setError(
          e.name === "NotAllowedError"
            ? en
              ? "Allow microphone access and try again."
              : "اسمح بالميكروفون ثم حاول مجددًا."
            : e.message,
        );
    }
  };
  return (
    <div className="realtime-panel">
      <audio ref={audio} autoPlay playsInline />
      <div
        className={`realtime-symbol ${state === "connected" ? "active" : ""}`}
      >
        <Volume2 size={48} />
      </div>
      <h2>
        {en ? "Speak. Listen. Keep talking." : "تكلّم. اسمع الرد. وكمل حديثك."}
      </h2>
      <p>
        {en
          ? "A direct voice conversation with your AI tutor. No message needs to be typed or sent."
          : "محادثة صوتية مباشرة مع المعلم الذكي، يسمعك ويرد بصوته دون كتابة أو إرسال رسائل."}
      </p>
      <span role="status" className="call-status">
        {state === "connected"
          ? en
            ? "Connected — speak naturally"
            : "متصل — تحدث براحتك"
          : state === "connecting"
            ? en
              ? "Connecting…"
              : "جارٍ الاتصال…"
            : en
              ? "Ready when you are"
              : "جاهز عندما تكون مستعدًا"}
      </span>
      <div className="lesson-actions">
        {state === "idle" ? (
          <button className="primary-button" onClick={start}>
            <Phone size={19} />
            {en ? "Start voice conversation" : "ابدأ المحادثة الصوتية"}
          </button>
        ) : (
          <>
            <button
              className="outline-button"
              disabled={state !== "connected"}
              onClick={() => {
                stream.current
                  ?.getAudioTracks()
                  .forEach((t) => (t.enabled = muted));
                setMuted(!muted);
              }}
            >
              {muted ? <MicOff size={19} /> : <Mic size={19} />}{" "}
              {muted
                ? en
                  ? "Unmute"
                  : "تشغيل الميكروفون"
                : en
                  ? "Mute"
                  : "كتم الميكروفون"}
            </button>
            <button className="primary-button" onClick={stop}>
              <PhoneOff size={19} />
              {en ? "End call" : "إنهاء الاتصال"}
            </button>
          </>
        )}
      </div>
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
      <p className="footnote">
        {en
          ? "Your microphone audio is sent to the AI provider during the call. Realtime service access, sign-in and provider billing are required. Calls end after ten minutes; you can reconnect."
          : "يُرسل صوت الميكروفون إلى مزود الذكاء الاصطناعي أثناء الاتصال. يلزم تسجيل الدخول وتفعيل خدمة Realtime ورصيد لدى المزود. تنتهي الجلسة بعد عشر دقائق ويمكنك بدء أخرى."}
      </p>
    </div>
  );
}
