// VideoGate.js
import React from "react";
import {
    View,
    Text,
    Pressable,
    ImageBackground,
    StatusBar,
    Dimensions,
    Platform,
    StyleSheet,
} from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { Audio } from "expo-av";

// ---- Config ----
const USE_LOCAL_INTRO = true; // <— change to false
const INTRO_VIDEO_URL = ""; // has AAC audio

const POSTER_SOURCE = require("./assets/images/parchment.png");
// ---------------

export default function VideoGate({ onDone }) {
    const { width, height } = Dimensions.get("window");
    const [isLoaded, setIsLoaded] = React.useState(false);
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [hasInteracted, setHasInteracted] = React.useState(false);

    // Source
    const localSource = React.useMemo(
        () => (USE_LOCAL_INTRO ? require("./assets/intro.mp4") : null),
        []
    );
    const remoteSource = React.useMemo(
        () => (!USE_LOCAL_INTRO && INTRO_VIDEO_URL ? { uri: INTRO_VIDEO_URL } : null),
        []
    );

    // ============== WEB PATH (native <video>) ==============
    if (Platform.OS === "web") {
        const videoRef = React.useRef(null);

        const [actuallyMuted, setActuallyMuted] = React.useState(true);
        const updateMuteState = () => {
            const m = !!videoRef.current?.muted;
            setActuallyMuted(m);
        };


        const handleCanPlay = () => setIsLoaded(true);
        const handleEnded = () => onDone?.();

        const handleStart = () => {
            setHasInteracted(true);
            try {
                if (videoRef.current) {
                    videoRef.current.defaultMuted = false;
                    videoRef.current.muted = false;
                    videoRef.current.volume = 1.0;
                    videoRef.current.play?.();
                    updateMuteState();
                }
            } catch { }
        };

        const handleUnmute = () => {
            setHasInteracted(true);
            try {
                if (videoRef.current) {
                    videoRef.current.defaultMuted = false;
                    videoRef.current.muted = false;
                    videoRef.current.volume = 1.0;
                    videoRef.current.play?.();
                    updateMuteState();
                }
            } catch { }
        };



        const handleSkip = () => {
            try { videoRef.current?.pause?.(); } catch { }
            onDone?.();
        };

        // NOTE: For web, `require("./assets/intro.mp4")` resolves to a URL string at runtime.
        // If you use a remote URL, we pass that instead.
        const src =
            (USE_LOCAL_INTRO && localSource) || (remoteSource && remoteSource.uri) || null;

        return (
            <View style={styles.wrap}>
                <StatusBar hidden />

                {src ? (
                    <video
                        ref={videoRef}
                        src={src}
                        style={{ width, height, objectFit: "cover" }}
                        autoPlay={false}
                        muted={false}
                        playsInline
                        preload="auto"
                        onLoadedMetadata={updateMuteState}
                        onVolumeChange={updateMuteState}
                        onCanPlay={() => { setIsLoaded(true); updateMuteState(); }}
                        onPlay={() => { setIsPlaying(true); updateMuteState(); }}
                        onEnded={handleEnded}
                        onError={() => {
                            console.warn("Intro video failed on web; skipping…");
                            onDone?.();
                        }}
                        controls={false}
                    />


                ) : (
                    <ImageBackground
                        source={POSTER_SOURCE}
                        style={{ width, height, justifyContent: "center", alignItems: "center" }}
                    >
                        <Text style={{ color: "#330000", fontSize: 26, fontWeight: "800" }}>
                            RDR2 Slang Trainer
                        </Text>
                        <Text style={{ color: "#330000", marginTop: 8 }}>
                            Intro video not found
                        </Text>
                    </ImageBackground>
                )}

                {/* Loading */}
                {!isLoaded && (
                    <View style={styles.bottomNote}>
                        <Text style={styles.noteText}>Loading…</Text>
                    </View>
                )}

                {/* Tap to Start (if loaded but autoplay muted) */}
                {isLoaded && !isPlaying && (
                    <Pressable style={styles.centerCta} onPress={() => {
                        setHasInteracted(true);
                        try {
                            if (videoRef.current) {
                                videoRef.current.defaultMuted = false;
                                videoRef.current.muted = false;     // ensure unmuted
                                videoRef.current.volume = 1.0;
                                videoRef.current.play?.();          // user-initiated play
                                updateMuteState();
                            }
                        } catch { }
                    }}>
                        <Text style={styles.ctaText}>Play with sound</Text>
                    </Pressable>
                )}

                {/* Unmute button shown whenever video is playing but muted */}
                {isPlaying && actuallyMuted && (
                    <Pressable style={styles.unmuteBtn} onPress={handleUnmute}>
                        <Text style={styles.unmuteText}>Unmute</Text>
                    </Pressable>
                )}


                {/* Skip */}
                <Pressable onPress={handleSkip} style={styles.skipBtn}>
                    <Text style={styles.skipText}>Skip</Text>
                </Pressable>
            </View>
        );
    }

    // ============== NATIVE (iOS/Android via expo-video) ==============
    React.useEffect(() => {
        // iOS: allow audio even in silent mode
        Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
        }).catch(() => { });
    }, []);

    const source = USE_LOCAL_INTRO ? localSource : remoteSource;

    const player = useVideoPlayer(source, (p) => {
        p.loop = false;
        p.muted = false;    // ⬅️ start unmuted
        p.volume = 1.0;     // ⬅️ full volume
        p.play();           // autoplay works on native
    });


    React.useEffect(() => {
        // If video errors on native, just continue
        const offErr = player.addListener("error", (e) => {
            console.warn("intro video error", e);
            onDone?.();
        });

        // Safety timeout: if not loaded in 4s, continue
        const t = setTimeout(() => {
            if (!isLoaded) onDone?.();
        }, 4000);

        return () => {
            offErr.remove?.();
            clearTimeout(t);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [player, onDone, isLoaded]);

    const handleStartNative = () => {
        setHasInteracted(true);
        try {
            player.muted = false;     // unmute
            player.volume = 1.0;      // ensure full volume
            player.play();
        } catch { }
    };


    const handleSkipNative = () => {
        try { player.pause?.(); } catch { }
        onDone?.();
    };

    return (
        <View style={styles.wrap}>
            <StatusBar hidden />

            {source ? (
                <VideoView
                    style={{ width, height }}
                    player={player}
                    nativeControls={false}
                    posterSource={POSTER_SOURCE}
                    usePoster={!isLoaded}
                    allowsFullscreen={false}
                    allowsPictureInPicture={false}
                />
            ) : (
                <ImageBackground
                    source={POSTER_SOURCE}
                    style={{ width, height, justifyContent: "center", alignItems: "center" }}
                >
                    <Text style={{ color: "#330000", fontSize: 26, fontWeight: "800" }}>
                        RDR2 Slang Trainer
                    </Text>
                    <Text style={{ color: "#330000", marginTop: 8 }}>
                        Intro video not found
                    </Text>
                </ImageBackground>
            )}

            {!isLoaded && (
                <View style={styles.bottomNote}>
                    <Text style={styles.noteText}>Loading…</Text>
                </View>
            )}

            {isLoaded && !isPlaying && (
                <Pressable style={styles.centerCta} onPress={handleStartNative}>
                    <Text style={styles.ctaText}>{hasInteracted ? "Starting…" : "Tap to Start"}</Text>
                </Pressable>
            )}

            <Pressable onPress={handleSkipNative} style={styles.skipBtn}>
                <Text style={styles.skipText}>Skip</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { flex: 1, backgroundColor: "black", justifyContent: "center", alignItems: "center" },
    skipBtn: {
        position: "absolute", top: 14, right: 14,
        paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12,
        backgroundColor: "rgba(0,0,0,0.45)",
    },
    skipText: { color: "#fff", fontWeight: "700" },

    bottomNote: { position: "absolute", bottom: 20 },
    noteText: { color: "#fff", opacity: 0.85 },

    centerCta: {
        position: "absolute", alignSelf: "center",
        paddingVertical: 10, paddingHorizontal: 16, borderRadius: 14,
        backgroundColor: "rgba(0,0,0,0.55)", borderWidth: 1, borderColor: "rgba(255,255,255,0.35)",
    },
    ctaText: { color: "#fff", fontWeight: "800", letterSpacing: 0.4 },
    unmuteBtn: {
        position: "absolute",
        bottom: 20,
        right: 20,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 14,
        backgroundColor: "rgba(0,0,0,0.55)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.35)",
    },
    unmuteText: { color: "#fff", fontWeight: "800", letterSpacing: 0.4 },

});
