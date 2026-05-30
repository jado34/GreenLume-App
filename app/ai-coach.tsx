import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import Toast from 'react-native-toast-message';
import { storage } from '../utils/storage';
import { useUserData } from '../hooks/useUserData';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { USER_DATA_QUERY_KEY } from '../hooks/useUserData';
import { Colors } from '../constants/colors';
import { Typography, Shadows } from '../constants/typography';
import { getLocalContext, LocalContext } from '../utils/location';
import { getAICoachResponse } from '../utils/gemini';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  isStreaming?: boolean;
}

export default function AICoachScreen() {
  const { data: userData } = useUserData();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAiResponding, setIsAiResponding] = useState(false);
  const showPaywall = false;
  const [localContext, setLocalContext] = useState<LocalContext | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  // FIX #4: Use a ref to track if the greeting has fired, so re-visits don't reset it
  const greetingFiredRef = useRef(false);

  // Initialize dynamic greeting on mount
  useFocusEffect(
    useCallback(() => {
      if (!userData) return;
      const loadContextAndGreet = async () => {
        let ctx = null;
        ctx = await getLocalContext();
        if (ctx) setLocalContext(ctx);

        // Fade in the screen
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();

        // FIX #4: Only send greeting once per mount using a ref flag
        if (!greetingFiredRef.current) {
          greetingFiredRef.current = true;
          const hour = new Date().getHours();
          let timeGreeting = "Hi there";
          if (hour < 12) timeGreeting = "Good morning";
          else if (hour < 17) timeGreeting = "Good afternoon";
          else timeGreeting = "Good evening";

          let greeting = `${timeGreeting}! I'm your GreenLume Eco-Coach. I've been analyzing your recent activity.\n\n`;
          
          if (ctx) {
            if (ctx.condition === 'raining' || ctx.condition === 'stormy') {
              greeting += `🌧️ It looks like it's ${ctx.condition} and ${ctx.temperatureC}°C outside! Good time to harvest rainwater for cleaning or plants, which saves borehole pumping electricity. If you must travel, consider carpooling or using the BRT/train to avoid gridlock traffic. \n\n`;
            } else if (ctx.condition === 'sunny' || ctx.condition === 'clear') {
              greeting += `☀️ It's a sunny ${ctx.temperatureC}°C outside! Great day to use natural lighting or solar setups. Watch the AC usage to save on prepaid meter units, and try opening windows for a natural breeze instead. \n\n`;
            } else if (ctx.condition === 'cloudy' || ctx.condition === 'foggy') {
              greeting += `🌫️ It's ${ctx.condition} and ${ctx.temperatureC}°C outside (typical Harmattan vibes). The cooler air means you can easily switch off the AC and run a fan or use natural ventilation, saving massive generator fuel! \n\n`;
            } else {
              greeting += `🌡️ It's currently ${ctx.temperatureC}°C and ${ctx.condition} outside. Perfect weather to walk short distances instead of driving! \n\n`;
            }
          }
        
          if (userData.currentStreak > 2) {
            greeting += `🔥 Incredible ${userData.currentStreak}-day streak! Consistency is key, and you are crushing your daily habits. `;
          } else if (userData.actionsLogged > 0) {
            greeting += `I see you've logged ${userData.actionsLogged} total actions so far. Keep going! `;
          } else {
            greeting += `You haven't logged any actions today yet. Tap 'Log Actions' to record your first green choice! `;
          }

          if (userData.totalPoints > 500) {
            greeting += `With ${userData.totalPoints} GreenLume points, you are outperforming 85% of other eco-warriors in your area. \n\n`;
          } else {
            greeting += `You have accumulated ${userData.totalPoints} points so far. Every habit counts towards a sustainable future! \n\n`;
          }

          greeting += `💡 **My Daily Insight for you:**\nBased on your activity, you can make a huge impact today by declining plastic cutlery on your next Chowdeck or Glovo delivery, or by carrying an aesthetic flask for drinking water to reduce single-use plastic bottles.`;

          // Start typewriter stream for first message
          streamMessage(greeting);
        }
      };
    
      loadContextAndGreet();
    }, [userData?.currentStreak, userData?.actionsLogged])
  );

  // Typewriter effect generator
  const streamMessage = (fullText: string) => {
    const messageId = Math.random().toString();
    setMessages((prev) => [...prev, { id: messageId, sender: 'ai', text: '', isStreaming: true }]);
    
    let index = 0;
    let currentText = '';
    const interval = setInterval(() => {
      // Batch 4 characters per tick — same visual speed, ~75% fewer setState calls
      const chunkSize = 4;
      for (let i = 0; i < chunkSize && index < fullText.length; i++, index++) {
        currentText += fullText.charAt(index);
      }
      setMessages((prev) => 
        prev.map((msg) => (msg.id === messageId ? { ...msg, text: currentText } : msg))
      );
      // Only scroll every 6th tick to reduce scroll jank on budget Android devices
      if (index % 6 === 0) scrollViewRef.current?.scrollToEnd({ animated: true });

      if (index >= fullText.length) {
        clearInterval(interval);
        setMessages((prev) => 
          prev.map((msg) => (msg.id === messageId ? { ...msg, isStreaming: false } : msg))
        );
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }
    }, 20); // 20ms × 4 chars = ~200 chars/sec, still feels fast and types smoothly
  };

  const handleSend = async () => {
    if (!inputText.trim() || isAiResponding) return;

    const userText = inputText.trim();
    setInputText('');
    
    // Add user message
    const userMsgId = Math.random().toString();
    const newMessages = [...messages, { id: userMsgId, sender: 'user' as const, text: userText }];
    setMessages(newMessages);
    setIsAiResponding(true);
    
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 50);

    try {
      // Format chat history for Gemini API
      const chatHistory = newMessages.map(msg => ({
        role: msg.sender === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: msg.text }]
      }));

      // Gather current context
      const context = {
        currentTime: `${new Date().toLocaleTimeString()} on ${new Date().toDateString()}`,
        weather: localContext ? {
          temperatureC: localContext.temperatureC,
          condition: localContext.condition,
          isDay: localContext.isDay
        } : null,
        userStats: {
          streak: userData?.currentStreak || 0,
          totalPoints: userData?.totalPoints || 0,
          actionsLoggedCount: userData?.actionsLogged || 0,
          companyName: userData?.companyName || undefined,
          customSquadName: userData?.customSquadName || undefined,
        }
      };

      // Call Gemini API
      const reply = await getAICoachResponse(userText, chatHistory.slice(0, -1), context);
      setIsAiResponding(false);
      streamMessage(reply);
    } catch (err) {
      console.warn('[AI Coach] Gemini API error, using local fallback:', err);
      // Local fallback
      const reply = generateAiReply(userText);
      setIsAiResponding(false);
      streamMessage(reply);
    }
  };

  const generateAiReply = (query: string): string => {
    const q = query.toLowerCase();
    const name = userData?.companyName || "your team";
    const pts = userData?.totalPoints || 0;
    const streak = userData?.currentStreak || 0;

    if (q.includes('hello') || q.includes('hi ') || q.includes('hey')) {
      return `Hello! How can I help you on your sustainability journey today? Ask me about your points, how to improve your streak, or how to get started on team challenges!`;
    }
    if (q.includes('point') || q.includes('score') || q.includes('lume')) {
      return `You currently have ${pts} GreenLume points! 🌟\n\nYou can earn more points by logging high-impact actions like "Public Transit" (+25 pts), "Plant-Based Meals" (+20 pts), or "Reusable Bag" (+15 pts). Completing weekly challenges also rewards bonus points — every logged action counts!`;
    }
    if (q.includes('streak') || q.includes('day') || q.includes('fire')) {
      return `Your current streak is ${streak} days. 🔥\n\nTo build a strong habit, try setting a daily reminder in the Profile settings. Logging just one action every day keeps the momentum going. Remember, consistency is the key to reducing your carbon footprint!`;
    }
    if (q.includes('squad') || q.includes('team') || q.includes('company') || q.includes('friend')) {
      return `Competing together makes saving the planet fun! 👥\n\nAs a GreenLume member, you can create your own **Custom Squads** completely free — head to the Teams tab, generate an invite code, and share it with friends, family, or colleagues to compete for the top spot on the leaderboard!`;
    }
    if (q.includes('water') || q.includes('plant') || q.includes('nursery') || q.includes('seed')) {
      return `Your Virtual Nursery is a direct reflection of your real-world impact! 💧\n\nFor every green action you log, you earn Water Droplets. Use them to water your plants before they dry up. Growing a mature tree earns you extra coins to buy more seeds!`;
    }
    if (q.includes('plastic') || q.includes('waste') || q.includes('bag')) {
      return `Reducing waste is one of the most direct ways to protect marine life. 🐳\n\nTry to log "Reusable Bag" or "Avoided Plastic" actions today. Each plastic item avoided keeps waste out of oceans and landfills. Did you know a single plastic bag can take 500 years to decompose?`;
    }
    if (q.includes('transport') || q.includes('bus') || q.includes('car') || q.includes('cycle')) {
      return `Transportation is a major driver of greenhouse gases. 🚌\n\nBy taking public transit or cycling instead of driving, you save around 2.0kg of CO₂ per trip! Try replacing one car trip this week with a walk or transit ride.`;
    }
    if (q.includes('weather') || q.includes('outside') || q.includes('today')) {
      if (localContext) {
        return `Based on your local weather (${localContext.temperatureC}°C and ${localContext.condition}), I recommend ${localContext.condition === 'raining' || localContext.condition === 'stormy' ? 'focusing on reducing household generator runs and harvesting rainwater' : 'taking advantage of the clear skies to walk short distances or rideshare instead of driving'}!`;
      } else {
        return `I don't have access to your local weather right now, but generally, try to match your actions to the season!`;
      }
    }
    
    // Default fallback response
    return `That's a great question! GreenLume is designed to help you build small habits with large cumulative impacts.\n\nKeep logging actions like water conservation, public transit, and recycling. If you want specific advice, try asking: "How do I earn more points?", "How do custom squads work?", or "Tell me about my streak!"`;
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <LinearGradient colors={[Colors.primary95, Colors.primary90]} style={StyleSheet.absoluteFill} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Ionicons name="sparkles" size={20} color={Colors.primary} />
          <Text style={styles.headerTitle}>AI Eco-Coach</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
          <Animated.View style={{ opacity: fadeAnim, gap: 16 }}>
            {/* Messages Thread */}
            {messages.map((msg) => {
              const isAi = msg.sender === 'ai';
              return (
                <View 
                  key={msg.id} 
                  style={[
                    styles.chatContainer, 
                    !isAi && { alignSelf: 'flex-end', flexDirection: 'row-reverse', marginLeft: 40, marginRight: 0 }
                  ]}
                >
                  {isAi && (
                    <View style={styles.avatarContainer}>
                      <Text style={styles.avatarEmoji}>🤖</Text>
                    </View>
                  )}
                  <View 
                    style={[
                      styles.messageBubble, 
                      isAi 
                        ? { backgroundColor: Colors.white, borderTopLeftRadius: 4 } 
                        : { backgroundColor: Colors.primary, borderTopRightRadius: 4, borderColor: Colors.primaryDark }
                    ]}
                  >
                    <Text style={[styles.messageText, !isAi && { color: Colors.white }]}>
                      {msg.text}
                    </Text>
                  </View>
                </View>
              );
            })}

            {/* AI Thinking Bubble */}
            {isAiResponding && (
              <View 
                style={styles.chatContainer}
                accessible={true}
                accessibilityLabel="Eco-Coach is thinking, please wait"
                accessibilityLiveRegion="polite"
              >
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarEmoji}>🤖</Text>
                </View>
                <View style={[styles.messageBubble, { backgroundColor: Colors.white, borderTopLeftRadius: 4 }]}>
                  <View style={styles.typingIndicator}>
                    <Ionicons name="ellipsis-horizontal" size={24} color={Colors.primary} />
                    <Text style={styles.typingText}>Eco-Coach is thinking...</Text>
                  </View>
                </View>
              </View>
            )}

            {/* User Stats Context Card */}
            {messages.length > 0 && !isAiResponding && (
              <View style={styles.contextCard}>
                <Text style={styles.contextTitle}>Data Source</Text>
                <View style={styles.contextRow}>
                  <Ionicons name="flash" size={16} color="#f59e0b" />
                  <Text style={styles.contextText}>Streak: {userData?.currentStreak || 0} days</Text>
                </View>
                <View style={styles.contextRow}>
                  <Ionicons name="trophy" size={16} color={Colors.primary} />
                  <Text style={styles.contextText}>Points: {userData?.totalPoints || 0}</Text>
                </View>
              </View>
            )}

          </Animated.View>
      </ScrollView>

      {/* Input area */}
      <View style={styles.inputArea}>
        {/* Suggested prompts — shown when conversation is empty */}
        {messages.length === 0 && !isAiResponding && (
          <View style={styles.promptChipsRow}>
            {[
              { label: '🔥 Streak tips',       text: 'How do I maintain a long streak?' },
              { label: '🌱 Earn more points',  text: 'What are the best ways to earn GreenLume points?' },
              { label: '🌍 My CO₂ impact',   text: 'Explain my CO₂ impact so far' },
              { label: '👥 Custom squads',    text: 'How do custom squads work?' },
            ].map((chip) => (
              <TouchableOpacity
                key={chip.label}
                style={styles.promptChip}
                onPress={() => {
                  setInputText(chip.text);
                }}
                activeOpacity={0.8}
                accessibilityLabel={`Suggested: ${chip.text}`}
                accessibilityRole="button"
              >
                <Text style={styles.promptChipText}>{chip.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.inputBox}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask your Eco-Coach a question..."
            placeholderTextColor={Colors.textMuted}
            editable={!isAiResponding}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            accessibilityLabel="Type a message to your Eco-Coach"
          />
          <TouchableOpacity 
            onPress={handleSend}
            disabled={isAiResponding || !inputText.trim()}
            accessibilityLabel="Send message"
            accessibilityRole="button"
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={!inputText.trim() || isAiResponding ? Colors.neutral300 : Colors.primary} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary95,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46, 125, 50, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.lg,
    color: Colors.primary,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },

  chatContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    maxWidth: '85%',
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    ...Shadows.md,
  },
  avatarEmoji: {
    fontSize: 18,
  },
  messageBubble: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: 14,
    borderRadius: 16,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.1)',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
  },
  messageText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  contextCard: {
    backgroundColor: 'rgba(46, 125, 50, 0.05)',
    padding: 14,
    borderRadius: 14,
    alignSelf: 'center',
    width: '80%',
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.15)',
    marginTop: 10,
  },
  contextTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  contextText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  inputArea: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.2)',
  },
  textInput: {
    flex: 1,
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    paddingVertical: 4,
  },
  promptChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  promptChip: {
    backgroundColor: Colors.primary90,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  promptChipText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
  },
});

