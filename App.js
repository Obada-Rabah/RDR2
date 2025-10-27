import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View, Text, Pressable, ScrollView, StyleSheet, SafeAreaView,
  Alert, StatusBar, Platform, ImageBackground, Image, Modal, Linking
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Speech from "expo-speech";
import { Audio } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import * as Font from "expo-font";
import VideoGate from "./VideoGate"; // 👈 separate intro
import { AUDIO_MAP } from "./AUDIO_MAP";

const WesternText = ({ style, children, ...rest }) => {
  const s = USE_WESTERN_FONT ? [{ fontFamily: "ChineseRocks", letterSpacing: 0.5 }, style] : [style];
  return <Text {...rest} style={s}>{children}</Text>;
};

const YT_URL = "https://youtu.be/8ecOfG026gY?si=DG-gx7cAo742fLaB";

const YT_WEB = "https://youtu.be/8ecOfG026gY?si=DG-gx7cAo742fLaB";
const YT_INTENT = "vnd.youtube://8ecOfG026gY"; // youtube app intent

async function openYoutube() {
  try {
    if (Platform.OS === "web") {
      window.open(YT_WEB, "_blank", "noopener,noreferrer");
      return;
    }

    // Try YouTube app first (Android/iOS)
    const intentURL = Platform.OS === "android" ? YT_INTENT : YT_WEB;
    const can = await Linking.canOpenURL(intentURL);
    if (can) {
      await Linking.openURL(intentURL);
      return;
    }

    // Fallback to web
    const canWeb = await Linking.canOpenURL(YT_WEB);
    if (canWeb) {
      await Linking.openURL(YT_WEB);
      return;
    }

    Alert.alert("Sorry", "Can't open the YouTube link on this device.");
  } catch (e) {
    console.warn("openYoutube failed", e);
    Alert.alert("Error", "Failed to open the link.");
  }
}


const WRONG_SFX = [
  require("./assets/audio/wrong1.mp3"),
  require("./assets/audio/wrong2.mp3"),
  require("./assets/audio/wrong3.mp3"),
  require("./assets/audio/wrong4.mp3"),
];

// ==== Theme & Assets (adjust paths if needed) ====
const THEME = {
  bgFrom: "#100000", bgTo: "#5c0a0a",
  card: "rgba(255,255,255,0.06)", cardStrong: "rgba(255,255,255,0.12)",
  accent: "#d62626", purple: "#a855f7", text: "#ffffff",
};
const ASSETS = {
  font: require("./assets/fonts/ChineseRocks-Regular.otf"),
  parchment: require("./assets/images/parchment.png"),
  sheriff: require("./assets/images/badge-sheriff.png"),
  horse: require("./assets/images/horse.png"),
};
const USE_WESTERN_FONT = true;   // 👈 turn it on

function ParchmentCard({ children, style, imageStyle }) {
  return (
    <ImageBackground
      source={ASSETS.parchment}
      imageStyle={[{ borderRadius: 22, opacity: 0.95 }, imageStyle]}
      style={[{ backgroundColor: "transparent", padding: 16, borderRadius: 22 }, style]}
    >
      {children}
    </ImageBackground>
  );
}



const PHRASES = [
  { term: "Ain’t", ar: "ليست / لست / ليس", en: "is not / am not / are not (informal)" },
  { term: "Y’all", ar: "أنتم جميعاً", en: "you all (plural you)" },
  { term: "Folks", ar: "الناس / الجماعة", en: "people / group of people" },
  { term: "Howdy", ar: "مرحباً", en: "hello (cowboy greeting)" },
  { term: "Partner", ar: "رفيق / صديق", en: "friend / buddy (western)" },
  { term: "Giddy up", ar: "انطلق (للحصان)", en: "make the horse go" },
  { term: "Whoa", ar: "توقف (للحصان)", en: "stop (to a horse)" },
  { term: "Reckon", ar: "أعتقد / أظن", en: "think / suppose (western)" },
  { term: "Right as rain", ar: "بخير تماماً", en: "completely fine / alright" },
  { term: "Much obliged", ar: "شكراً جزيلاً", en: "thank you kindly" },
  { term: "The law", ar: "الشرطة / السلطات", en: "police / sheriffs / marshals" },
  { term: "Wanted", ar: "مطلوب من العدالة", en: "sought by police (poster/notice)" },
  { term: "Bounty", ar: "مكافأة مالية", en: "reward for catching someone" },
  { term: "Outlaw", ar: "خارج عن القانون", en: "criminal living outside the law" },
  { term: "Heist / Score", ar: "سرقة كبيرة / عملية", en: "big robbery" },
  { term: "Hold up", ar: "سطو مسلح", en: "rob at gunpoint" },
  { term: "Shootout", ar: "إطلاق نار / مواجهة", en: "gunfight" },
  { term: "Yellow-belly", ar: "جبان", en: "coward" },
  { term: "Make a run for it", ar: "اهرب بسرعة", en: "escape quickly" },
  { term: "Camp", ar: "المعسكر", en: "gang base / camp" },
  { term: "Grub", ar: "طعام", en: "food (slang)" },
  { term: "Saloon", ar: "حانة", en: "bar / tavern" },
  { term: "Stable", ar: "إسطبل", en: "horse shop / barn" },
  { term: "Homestead", ar: "بيت ريفي", en: "farmhouse / rural house" },
  { term: "Trading post", ar: "محطة تجارية", en: "small frontier shop" },
  { term: "Pelt", ar: "فروة / جلد الحيوان", en: "animal skin" },
  { term: "Trapper", ar: "صياد الفراء", en: "fur buyer / hunter" },
  { term: "Dead or alive", ar: "حياً أو ميتاً", en: "capture acceptable in any state" },
  { term: "High noon", ar: "منتصف النهار", en: "midday (duel time)" },
  { term: "On the run", ar: "هارب", en: "fleeing from the law" },
  { term: "Rustling cattle", ar: "سرقة الأبقار", en: "stealing cows" },
  { term: "Wanted poster", ar: "ملصق مطلوب", en: "notice with a bounty" },
  { term: "Hit the trail", ar: "انطلق في الطريق", en: "set off / leave" },
  { term: "Hang him high", ar: "اعدمه شنقاً", en: "execute by hanging" },
  { term: "Shoot the breeze", ar: "دردشة", en: "chat casually" },
  { term: "Easy there", ar: "اهدأ", en: "calm down (often to horse)" },
  { term: "Son of a gun", ar: "يا ابن الحرام", en: "mild insult / exclamation" },
  { term: "Score to settle", ar: "تصفية حساب", en: "revenge to take" },
  { term: "Blood on your hands", ar: "دم على يديك", en: "responsible for killing" },
  { term: "Ride out", ar: "انطلق ممتطياً", en: "depart on horseback" },
  { term: "Lay low", ar: "ابق مختفياً", en: "avoid attention / hide" },
  { term: "By the fire", ar: "حول النار", en: "at the campfire" },
  { term: "Go fetch", ar: "اذهب وأحضر", en: "go and bring back" },
  { term: "Your money or your life", ar: "مالك أو حياتك", en: "hand over money or die (threat)" },
  { term: "Marshal", ar: "مارشال (شرطي اتحادي)", en: "US federal law officer" },
  { term: "Sheriff", ar: "شريف (شرطي محلي)", en: "county/town law officer" },
  { term: "Deputy", ar: "نائب الشريف", en: "assistant to the sheriff" },
  { term: "Posse", ar: "فرقة مطاردة", en: "group hunting a criminal" },
  { term: "Holster", ar: "جراب المسدس", en: "gun holder at belt" },
  { term: "Draw (your gun)", ar: "اسحب سلاحك", en: "pull your gun out" },
  { term: "Saddle up", ar: "جهّز السرج", en: "prepare the horse to ride" },
  { term: "Break a horse", ar: "ترويض حصان", en: "train a wild horse" },
  { term: "General store", ar: "متجر عام", en: "shop with basic goods" },
  { term: "Fence (merchant)", ar: "تاجر مسروقات", en: "buyer of stolen goods" },
  { term: "Wanted level", ar: "مستوى المطلوب", en: "how much police are after you" },
  { term: "Witness", ar: "شاهد", en: "person who saw a crime" },
  { term: "Report the crime", ar: "إبلاغ عن الجريمة", en: "notify the law" },
  { term: "Gun down", ar: "إطلاق النار وقتل", en: "shoot and kill" },
  { term: "Stick ’em up", ar: "ارفع يديك", en: "hands up (robbery)" },
  { term: "Stagecoach", ar: "عربة خيل للنقل", en: "horse-drawn carriage" },
  { term: "Train job", ar: "سرقة القطار", en: "train robbery" },
  { term: "Bank job", ar: "سرقة بنك", en: "bank robbery" },
  { term: "Hideout", ar: "وكر / مخبأ", en: "gang base / lair" },
  { term: "Shakedown", ar: "ابتزاز / ترهيب", en: "intimidation for money" },
  { term: "Take cover", ar: "اختبئ", en: "hide behind something (combat)" },
  { term: "Peacemaker", ar: "مسدس (لقب)", en: "nickname for a revolver" },
  { term: "Reload", ar: "أعد تعبئة الرصاص", en: "load more bullets" },
  { term: "Holdup note", ar: "ورقة تهديد للسطو", en: "note used to rob quietly" },
  { term: "Wanted dead", ar: "مطلوب ميت", en: "bounty requires killing" },
  { term: "Wanted alive", ar: "مطلوب حي", en: "bounty requires capture" },
  { term: "Camp chores", ar: "أعمال المعسكر", en: "tasks around camp" },
  { term: "Ledger", ar: "دفتر الحسابات", en: "accounting book" },
  { term: "Tonic", ar: "مقوٍ / دواء", en: "health/stamina item" },
  { term: "Provision", ar: "مؤن", en: "supplies/food" },
  { term: "Satchel", ar: "حقيبة", en: "your bag/inventory" },
  { term: "Bounty hunter", ar: "صياد جوائز", en: "person who hunts fugitives" },
  { term: "Wanted witness", ar: "شاهد مُبلغ", en: "witness going to report" },
  { term: "Defuse (a situation)", ar: "تهدئة الموقف", en: "calm things down" },
  { term: "Antagonize", ar: "استفزاز", en: "provoke / insult" },
  { term: "Charm (interact)", ar: "استمالة / مجاملة", en: "be nice to influence" },
  { term: "Honor", ar: "الشرف", en: "moral score (good/bad)" },
  { term: "Camp contribution", ar: "مساهمة للمعسكر", en: "donation to gang funds" },
  { term: "Wanted radius", ar: "نطاق المطاردة", en: "area where law searches" },
  { term: "Fence wagon", ar: "عربة تاجر المسروقات", en: "wagon to sell stolen goods" },
  { term: "Fence buyer", ar: "مشتري مسروقات", en: "trader who buys stolen items" },
];


// ===== Helpers =====
const shuffle = (arr) => arr.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
const save = async (k, v) => { try { await AsyncStorage.setItem(k, JSON.stringify(v)); } catch { } };
const load = async (k, f) => { try { const r = await AsyncStorage.getItem(k); return r ? JSON.parse(r) : f; } catch { return f; } };

async function speakTerm(term) {
  // إذا فيه ملف مسجل للكلمة، شغّله
  const entry = AUDIO_MAP[term];
  if (entry) {
    try {
      const { sound } = await Audio.Sound.createAsync(entry);
      sound.setOnPlaybackStatusUpdate((s) => s.isLoaded && s.didJustFinish && sound.unloadAsync());
      await sound.playAsync();
      return;
    } catch (e) {
      console.warn("Audio play error", e);
    }
  }
  // وإلا ارجع للـ TTS الإنجليزي كباك أب
  try {
    const speaking = await Speech.isSpeakingAsync();
    if (speaking) await Speech.stop();
  } catch { }
  Speech.speak(term, { language: "en-US", rate: 0.95 });
}


const MODES = ["EN→AR", "AR→EN", "EN→EN"];

// what should be on the FRONT (visible before flip) based on mode
const frontText = (item, mode) => {
  if (mode === "AR→EN") return item.ar;
  return item.term; // EN→AR or EN→EN
};

// what should be on the BACK (after flip) based on mode
const backText = (item, mode) => {
  if (mode === "AR→EN") return item.en;
  if (mode === "EN→AR") return item.ar;
  return item.en; // EN→EN -> show English meaning
};

function TipsModal({ visible, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>How to study</Text>
          <Text style={styles.modalText}>• Tap the big card to flip between the word and its meaning.</Text>
          <Text style={styles.modalText}>• Use “I knew it / Didn’t know” to track items for Review.</Text>
          <Text style={styles.modalText}>• Switch modes with EN→AR / AR→EN / EN→EN buttons.</Text>
          <Text style={styles.modalTitle}>طريقة الدراسة</Text>
          <Text style={styles.modalText}>• اضغط على البطاقة الكبيرة لقلبها بين الكلمة ومعناها.</Text>
          <Text style={styles.modalText}>• استخدم “عرفتها / ما عرفتها” لتتبع الكلمات للمراجعة.</Text>
          <Text style={styles.modalText}>• غيّر الوضع باستخدام الأزرار EN→AR / AR→EN / EN→EN.</Text>
          <Pressable style={styles.modalBtn} onPress={onClose}>
            <Text style={styles.modalBtnText}>OK</Text>
          </Pressable>
        </View>

      </View>
    </Modal>
  );
}



export default function App() {
  const [ready, setReady] = useState(false);
  const [showApp, setShowApp] = useState(false);
  const [showTips, setShowTips] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch { }
    })();
  }, []);


  useEffect(() => {
    (async() => {
      if (USE_WESTERN_FONT) {
        await Font.loadAsync({ ChineseRocks: ASSETS.font });
      }
      // wait a tick
      setReady(true);
    })();
  }, []);
  


  if (!ready) return null;

  if (!showApp) return (
    <VideoGate
      onDone={async () => {
        try {
          // small audible beep to "unlock" audio contexts on some browsers
          const beep = new Audio.Sound();
          await beep.loadAsync({
            // 200ms 1kHz beep WAV (tiny)
            uri: "data:audio/wav;base64,UklGRkQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQwAAAAAAP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A"
          });
          await beep.playAsync();
          await new Promise(r => setTimeout(r, 220));
          await beep.unloadAsync();
        } catch { }
        setShowApp(true);
      }}
    />
  );


  return (
    <>
      <MainApp />
      <TipsModal
        visible={showTips}
        onClose={async () => {
          setShowTips(false);
          await AsyncStorage.setItem("tipsSeen_v2", "1");
        }}
      />
    </>
  );
}

function MainApp() {
  const [tab, setTab] = useState("Study");
  const [mode, setMode] = useState("EN→AR");
  const [pool, setPool] = useState(PHRASES.map((_, i) => i));
  const [mistakes, setMistakes] = useState([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [quizQ, setQuizQ] = useState(null);
  const [quizProgress, setQuizProgress] = useState({ correct: 0, total: 0, streak: 0 });
  const [locked, setLocked] = useState(false);       // prevent tapping options again
  const [wrongCount, setWrongCount] = useState(0);   // wrong picks so far (session)
  const [showWrong, setShowWrong] = useState(false); // brief “Wrong” overlay

  async function playWrongSfx(n) {
    // cycle 0,1,2,3,0,1,2,3,...
    const idx = n % WRONG_SFX.length;
    try {
      const { sound } = await Audio.Sound.createAsync(WRONG_SFX[idx]);
      sound.setOnPlaybackStatusUpdate((s) => s.isLoaded && s.didJustFinish && sound.unloadAsync());
      await sound.playAsync();
    } catch (e) {
      console.warn("Failed to play wrong sfx", e);
    }
  }


  useEffect(() => {
    (async () => {
      setTab(await load("tab", "Study"));
      setMode(await load("mode", "EN→AR"));
      setPool(await load("pool", PHRASES.map((_, i) => i)));
      setMistakes(await load("mistakes", []));
      setIndex(await load("studyIndex", 0));
      setQuizProgress(await load("quizProgress", { correct: 0, total: 0, streak: 0 }));
    })();
  }, []);

  useEffect(() => { save("tab", tab); }, [tab]);
  useEffect(() => { save("mode", mode); }, [mode]);
  useEffect(() => { save("pool", pool); }, [pool]);
  useEffect(() => { save("mistakes", mistakes); }, [mistakes]);
  useEffect(() => { save("studyIndex", index); }, [index]);
  useEffect(() => { save("quizProgress", quizProgress); }, [quizProgress]);

  const activeItems = useMemo(() => pool.map((i) => PHRASES[i]), [pool]);
  const accuracy = quizProgress.total ? Math.round((quizProgress.correct / quizProgress.total) * 100) : 0;
  useEffect(() => { if (tab === "Quiz") generateQuestion(); }, [tab, mode, pool]);

  function nextCard(step = 1) {
    setFlipped(false);
    setIndex((i) => (activeItems.length ? (i + step + activeItems.length) % activeItems.length : 0));
  }
  function markStudy(known) {
    const idx = pool[index];
    if (!known && !mistakes.includes(idx)) setMistakes([...mistakes, idx]);
    nextCard(1);
  }
  function generateQuestion() {
    if (!pool.length) return setQuizQ(null);
    const qIndex = pool[Math.floor(Math.random() * pool.length)];
    const wrongs = shuffle(pool.filter((i) => i !== qIndex)).slice(0, 3);
    const options = shuffle([qIndex, ...wrongs]);
    setQuizQ({ qIndex, options, correct: qIndex });
  }
  function answer(optionIndex) {
    if (locked || !quizQ) return;

    setLocked(true);

    const isCorrect = optionIndex === quizQ.correct;

    // update stats
    setQuizProgress((p) => ({
      correct: p.correct + (isCorrect ? 1 : 0),
      total: p.total + 1,
      streak: isCorrect ? p.streak + 1 : 0,
    }));

    if (!isCorrect) {
      if (!mistakes.includes(quizQ.qIndex)) setMistakes([...mistakes, quizQ.qIndex]);

      setShowWrong(true);

      const nextWrong = wrongCount + 1;
      setWrongCount(nextWrong);

      // use the PREVIOUS count so the first wrong plays sound #1
      playWrongSfx(wrongCount);

      setTimeout(() => {
        setShowWrong(false);
        generateQuestion();
        setLocked(false);
      }, 700);
    } else {
      setTimeout(() => {
        generateQuestion();
        setLocked(false);
      }, 200);
    }

  }

  function clearProgress() {
    setQuizProgress({ correct: 0, total: 0, streak: 0 });
    setMistakes([]);
    Alert.alert("Reset", "Progress has been reset.");
  }
  function removeFromReview(idx) {
    setMistakes(mistakes.filter((i) => i !== idx));
  }

  const titleStyle = USE_WESTERN_FONT ? [styles.title, { fontFamily: "ChineseRocks" }] : styles.title;

  return (
    <LinearGradient colors={[THEME.bgFrom, THEME.bgTo]} style={{ flex: 1 }}>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" />
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Pressable
                onPress={openYoutube}
                android_ripple={{ color: "rgba(0,0,0,0.15)", borderless: true }}
                hitSlop={6}
                accessibilityRole="link"
                accessibilityLabel="Open YouTube"
              >
                <Image source={ASSETS.sheriff} style={{ width: 28, height: 28, marginRight: 8 }} />
              </Pressable>
              <Text style={titleStyle}>RDR2 Slang Trainer</Text>
            </View>

            <View style={styles.tabs}>
              {["Study", "Quiz", "Review", "Settings"].map((t) => (
                <Button key={t} label={t} onPress={() => setTab(t)} active={tab === t} />
              ))}
            </View>
          </View>

          {/* Mode / Stats */}
          <View style={styles.barRow}>
            <Card title="Modes">
              <View style={styles.row}>
                {MODES.map((m) => (
                  <Pressable
                    key={m}
                    onPress={() => setMode(m)}
                    style={[
                      styles.modeBtn,
                      mode === m && styles.modeBtnActive
                    ]}
                  >
                    <Text style={[styles.modeBtnText, mode === m && styles.modeBtnTextActive]}>{m}</Text>
                  </Pressable>
                ))}
              </View>
            </Card>
          </View>

          {/* Content */}
          <ScrollView contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {tab === "Study" && (
              <StudyView
                items={activeItems}
                index={index}
                flipped={flipped}
                setFlipped={setFlipped}
                nextCard={nextCard}
                markStudy={markStudy}
                mode={mode}
              />
            )}
            {tab === "Quiz" && <QuizView quizQ={quizQ} mode={mode} answer={answer} locked={locked} showWrong={showWrong} />}
            {tab === "Review" && <ReviewView mistakes={mistakes} removeFromReview={removeFromReview} />}
            {tab === "Settings" && <SettingsView pool={pool} setPool={setPool} clearProgress={clearProgress} />}
          </ScrollView>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function Button({ label, onPress, active }) {
  return (
    <Pressable onPress={onPress} android_ripple={{ color: "rgba(0,0,0,0.15)" }} style={[styles.btn, active ? styles.btnActive : null]}>
      <Text style={[styles.btnText, active ? styles.btnTextActive : null]}>{label}</Text>
    </Pressable>
  );
}
function Pill({ label, onPress, active }) {
  return (
    <Pressable onPress={onPress} android_ripple={{ color: "rgba(255,255,255,0.15)" }} style={[styles.pill, active ? styles.pillActive : null]}>
      <Text style={styles.pillText}>{label}</Text>
    </Pressable>
  );
}
function Card({ title, children }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{title}</Text>
      <View style={{ marginTop: 6 }}>{children}</View>
    </View>
  );
}

function StudyView({ items, index, flipped, setFlipped, nextCard, markStudy, mode }) {
  if (!items.length) return <Empty label="Your pool is empty. Enable items in Settings." />;
  const item = items[index];

  // front/back text based on mode
  const front = frontText(item, mode);
  const back = backText(item, mode);

  return (
    <ImageBackground source={ASSETS.parchment} imageStyle={{ borderRadius: 22, opacity: 0.95 }} style={[styles.bigCard, { backgroundColor: "transparent" }]}>
      <View style={styles.between}>
        <Text style={styles.dim}>Flashcard {index + 1} / {items.length}</Text>
        <Text style={styles.dim}>Mode: <Text style={styles.bold}>{mode}</Text></Text>
      </View>

      {/* Flash card */}
      <View style={[styles.flash, { backgroundColor: THEME.cardStrong, marginTop: 10 }]}>
        <Pressable style={styles.center} onPress={() => setFlipped(!flipped)}>
          {!flipped ? (
            <View style={styles.center}>
              <Text style={styles.dim}>Term</Text>
              <View style={styles.rowCenter}>
                <Text style={styles.term}>{front}</Text>
                {/* Only speak when English is on the front */}
                {(mode !== "AR→EN") && (
                  <Pressable style={styles.speaker} onPress={() => speakTerm(front)}>
                    <Text style={styles.speakerText}>🔊</Text>
                  </Pressable>
                )}
              </View>
              <Text style={styles.tip}>Tap to flip</Text>
            </View>
          ) : (
            <View style={styles.center}>
              <Text style={styles.dim}>Meaning</Text>
              <Text style={styles.meaning}>{back}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* ACTIONS — now directly UNDER the card */}
      <View style={[styles.btnRow, { justifyContent: "center" }]}>
        <Ghost label="Prev" onPress={() => nextCard(-1)} />
        <Ghost label="Next" onPress={() => nextCard(1)} />
      </View>
      <View style={[styles.btnRow, { justifyContent: "center" }]}>
        <Solid label="I knew it" color="#22c55e" onPress={() => markStudy(true)} />
        <Solid label="Didn’t know" color="#f43f5e" onPress={() => markStudy(false)} />
      </View>
    </ImageBackground>
  );
}



function QuizView({ quizQ, mode, answer, locked, showWrong }) {
  if (!quizQ) return <Empty label="Preparing a question…" />;
  const q = PHRASES[quizQ.qIndex];
  const questionFront = (mode === "AR→EN") ? q.ar : q.term;

  const optionLabel = (i) => {
    const it = PHRASES[i];
    if (mode === "AR→EN") return it.en;
    if (mode === "EN→AR") return it.ar;
    return it.en; // EN→EN
  };

  return (
    <ImageBackground
      source={ASSETS.parchment}
      imageStyle={{ borderRadius: 22, opacity: 0.95 }}
      style={[styles.bigCard, { backgroundColor: "transparent" }]}
    >
      <Text style={styles.dim}>Choose the correct meaning</Text>

      <View style={styles.rowCenter}>
        <Text style={styles.question}>{questionFront}</Text>
        {(mode !== "AR→EN") && (
          <Pressable style={styles.speaker} onPress={() => speakTerm(questionFront)} disabled={locked}>
            <Text style={styles.speakerText}>🔊</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.grid2}>
        {quizQ.options.map((i) => (
          <Pressable
            key={i}
            onPress={() => answer(i)}
            disabled={locked}
            style={[
              styles.option,
              locked && { opacity: 0.6 } // dim while locked
            ]}
            android_ripple={{ color: "rgba(0,0,0,0.15)" }}
          >
            <Text style={styles.optionText}>{optionLabel(i)}</Text>
          </Pressable>
        ))}
      </View>

      {/* brief wrong feedback overlay */}
      {showWrong && (
        <View style={{
          position: "absolute",
          alignSelf: "center",
          top: 24,
          paddingVertical: 8,
          paddingHorizontal: 14,
          borderRadius: 12,
          backgroundColor: "rgba(0,0,0,0.6)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.35)"
        }}>
          <Text style={{ color: "#fff", fontWeight: "800" }}>✖ Wrong</Text>
        </View>
      )}

      <Text style={styles.tipSmall}>Tip: EN→EN tests your understanding without Arabic.</Text>
    </ImageBackground>
  );
}



function ReviewView({ mistakes, removeFromReview }) {
  if (!mistakes.length) return <Empty label="No mistakes yet — great job!" />;
  return (
    <ImageBackground source={ASSETS.parchment} imageStyle={{ borderRadius: 22 }} style={[styles.bigCard, { backgroundColor: "transparent" }]}>
      <Text style={styles.sideTitle}>Review List ({mistakes.length})</Text>
      <View style={styles.grid2}>
        {mistakes.map((i) => {
          const { term, ar, en } = PHRASES[i];
          return (
            <View key={i} style={styles.reviewItem}>
              <Text style={styles.reviewTerm}>{term}</Text>
              <Text style={styles.reviewText}>{ar}</Text>
              <Text style={styles.reviewSub}>{en}</Text>
              <View style={styles.btnRow}>
                <Solid label="Remove" color={THEME.purple} onPress={() => removeFromReview(i)} />
              </View>
            </View>
          );
        })}
      </View>
    </ImageBackground>
  );
}

function SettingsView({ pool, setPool, clearProgress }) {
  const toggle = (idx) => {
    if (pool.includes(idx)) setPool(pool.filter((i) => i !== idx));
    else setPool([...pool, idx]);
  };
  return (
    <ImageBackground source={ASSETS.parchment} imageStyle={{ borderRadius: 22 }} style={[styles.bigCard, { backgroundColor: "transparent" }]}>
      <Text style={styles.sideTitle}>Active Items</Text>
      <Text style={styles.dim}>Choose which phrases are included in Study/Quiz. Progress is saved locally.</Text>

      <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ paddingVertical: 6 }}>
        {PHRASES.map((item, idx) => {
          const checked = pool.includes(idx);
          return (
            <Pressable key={idx} onPress={() => toggle(idx)} style={[styles.settingRow, checked && styles.settingRowOn]}>
              <View style={[styles.checkbox, checked && styles.checkboxOn]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.settingTerm}>{item.term}</Text>
                <Text style={styles.settingAr}>{item.ar}</Text>
                <Text style={styles.settingEn}>{item.en}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.btnRow}>
        <Ghost label="Select all" onPress={() => setPool(PHRASES.map((_, i) => i))} />
        <Ghost label="Clear all" onPress={() => setPool([])} />
        <Solid label="Reset progress" color="#f43f5e" onPress={clearProgress} />
      </View>
      <Text style={styles.tipSmall}>Tip: Add more items by editing the PHRASES array.</Text>
    </ImageBackground>
  );
}

function Empty({ label }) {
  return (
    <ParchmentCard style={styles.bigCard}>
      <Text style={styles.dim}>{label}</Text>
    </ParchmentCard>
  );
}


function Solid({ label, onPress, color }) {
  return (
    <Pressable onPress={onPress} android_ripple={{ color: "rgba(0,0,0,0.2)" }} style={[styles.solidBtn, shadow(), { backgroundColor: color || THEME.accent, borderWidth: 1, borderColor: "#000" }]}>
      <Text style={styles.solidText}>{label}</Text>
    </Pressable>
  );
}
function Ghost({ label, onPress }) {
  return (
    <Pressable onPress={onPress} android_ripple={{ color: "rgba(255,255,255,0.15)" }} style={[styles.ghostBtn, shadow(), { borderWidth: 1, borderColor: "rgba(0,0,0,0.35)" }]}>
      <Text style={styles.ghostText}>{label}</Text>
    </Pressable>
  );
}

const shadow = () =>
  Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOpacity: 0.25,
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 16,
    },
    android: { elevation: 6 },
  });

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "transparent" },
  container: { flex: 1, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 6 },
  header: { marginBottom: 10 },
  headerRow: { flexDirection: "row", alignItems: "center" },
  title: { color: THEME.text, fontSize: 26, fontWeight: "800", letterSpacing: 0.3 },
  tabs: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 8 },

  btn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.08)", ...shadow() },
  btnActive: { backgroundColor: THEME.accent },
  btnText: { color: THEME.text, fontWeight: "600" },
  btnTextActive: { color: THEME.text },

  barRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  card: { flexGrow: 1, minWidth: 220, backgroundColor: THEME.card, padding: 12, borderRadius: 16, ...shadow() },
  cardLabel: { color: "rgba(255,255,255,0.9)", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.6 },
  cardValue: { color: THEME.text, marginTop: 6 },

  bigCard: { backgroundColor: THEME.card, padding: 16, borderRadius: 22, marginTop: 10, ...shadow() },
  between: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dim: { color: "rgba(255,255,255,0.9)" },
  bold: { color: THEME.text, fontWeight: "800" },
  cols: { flexDirection: "row", gap: 12, flexWrap: "wrap" },

  flash: { flexGrow: 1, minWidth: 240, minHeight: 170, backgroundColor: THEME.cardStrong, borderRadius: 18, padding: 16, ...shadow() },
  sideCard: { flexGrow: 1, minWidth: 240, backgroundColor: THEME.cardStrong, borderRadius: 18, padding: 16, ...shadow() },
  sideTitle: { color: THEME.text, fontSize: 18, fontWeight: "800", marginBottom: 6 },
  sideText: { color: "rgba(255,255,255,0.95)", marginTop: 6, lineHeight: 20 },
  tip: { color: "rgba(255,255,255,0.7)", marginTop: 10 },

  row: { flexDirection: "row", gap: 8, marginTop: 6 },
  rowCenter: { flexDirection: "row", gap: 10, marginTop: 8, alignItems: "center", justifyContent: "center" },
  center: { alignItems: "center", justifyContent: "center", flex: 1 },

  term: { color: THEME.text, fontSize: 30, fontWeight: "800" },
  meaning: { color: THEME.text, fontSize: 22, textAlign: "center", lineHeight: 28 },

  btnRow: { flexDirection: "row", gap: 10, marginTop: 12, flexWrap: "wrap" },
  solidBtn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14 },
  solidText: { color: THEME.text, fontWeight: "800" },
  ghostBtn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, backgroundColor: THEME.cardStrong },
  ghostText: { color: THEME.text, fontWeight: "700" },

  question: { color: THEME.text, fontSize: 28, fontWeight: "800", marginTop: 6 },

  grid2: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 },
  option: { flexBasis: "48%", backgroundColor: THEME.cardStrong, padding: 14, borderRadius: 14, ...shadow() },
  optionText: { color: THEME.text },

  reviewItem: { flexBasis: "48%", backgroundColor: THEME.cardStrong, padding: 12, borderRadius: 14, ...shadow() },
  reviewTerm: { color: THEME.text, fontWeight: "800", fontSize: 16 },
  reviewText: { color: "rgba(255,255,255,0.95)", marginTop: 4, lineHeight: 20 },
  reviewSub: { color: "rgba(255,255,255,0.75)", marginTop: 2 },

  tipSmall: { color: "rgba(255,255,255,0.7)", marginTop: 8 },

  settingRow: { flexDirection: "row", gap: 10, backgroundColor: "rgba(255,255,255,0.08)", padding: 10, borderRadius: 14, alignItems: "center", marginBottom: 8, ...shadow() },
  settingRowOn: { backgroundColor: "rgba(168,85,247,0.25)" },
  checkbox: { width: 18, height: 18, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.25)" },
  checkboxOn: { backgroundColor: THEME.purple },
  settingTerm: { color: THEME.text, fontWeight: "800" },
  settingAr: { color: "rgba(255,255,255,0.95)", fontSize: 12, marginTop: 2 },
  settingEn: { color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 2 },
  speaker: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: THEME.cardStrong, borderRadius: 10, ...shadow() },
  speakerText: { color: THEME.text, fontSize: 16 },
  // Mode buttons
  modeBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(0,0,0,0.35)", marginRight: 8 },
  modeBtnActive: { backgroundColor: THEME.accent, borderColor: "#000" },
  modeBtnText: { color: THEME.text, fontWeight: "700" },
  modeBtnTextActive: { color: THEME.text },
  // Modal
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", padding: 20 },
  modalCard: { width: "100%", maxWidth: 420, backgroundColor: "rgba(255,255,255,0.95)", borderRadius: 20, padding: 18 },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#2b1a1a", marginBottom: 8 },
  modalText: { fontSize: 14, color: "#2b1a1a", marginTop: 6, lineHeight: 20 },
  modalBtn: { alignSelf: "flex-end", marginTop: 14, paddingVertical: 8, paddingHorizontal: 14, backgroundColor: "#2b1a1a", borderRadius: 12 },
  modalBtnText: { color: "#fff", fontWeight: "800" },

});
