import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Send, Check, CheckCheck } from 'lucide-react-native';
import { messagingService, Message } from '../../lib/messaging';
import { authService } from '../../lib/auth';
import { socketService } from '../../lib/socket';
import Colors from '../../constants/Colors';

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; name: string; role: string }>();
  const scrollViewRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadMessages();
    loadCurrentUser();

    // Mark messages as read
    messagingService.markAsRead(params.id);

    // Connect to socket and listen for new messages
    socketService.connect();

    const handleNewMessage = (message: Message) => {
      // Only add message if it's from this conversation
      if (message.fromId === params.id || message.toId === params.id) {
        setMessages((prev) => {
          // Avoid duplicates
          const exists = prev.find((m) => m.id === message.id);
          if (exists) return prev;
          return [...prev, message];
        });
        scrollToBottom();

        // Mark as read if from other user
        if (message.fromId === params.id) {
          messagingService.markAsRead(params.id);
        }
      }
    };

    socketService.onNewMessage(handleNewMessage);

    // Listen for typing indicator
    const handleUserTyping = (data: { userId: string; isTyping: boolean }) => {
      if (data.userId === params.id) {
        setIsTyping(data.isTyping);
      }
    };

    socketService.onUserTyping(handleUserTyping);

    // Listen for message read status
    const handleMessageRead = (data: { userId: string }) => {
      if (data.userId === params.id) {
        // Mark all messages to this user as read
        setMessages((prev) =>
          prev.map((msg) =>
            msg.toId === params.id ? { ...msg, read: true } : msg
          )
        );
      }
    };

    socketService.onMessageRead(handleMessageRead);

    // Listen for user status changes
    const handleUserStatus = (data: { userId: string; isOnline: boolean; lastSeen?: string }) => {
      if (data.userId === params.id) {
        setIsOnline(data.isOnline);
        setLastSeen(data.lastSeen || null);
      }
    };

    socketService.onUserStatus(handleUserStatus);

    // Request initial status
    socketService.requestUserStatus(params.id);

    // Cleanup
    return () => {
      socketService.offNewMessage();
      socketService.offMessageRead();
      socketService.offUserStatus();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Stop typing when leaving
      socketService.emitTyping(params.id, false);
    };
  }, [params.id]);

  const loadCurrentUser = async () => {
    const user = await authService.getCurrentUser();
    if (user) setCurrentUserId(user.id);
  };

  const loadMessages = async () => {
    const data = await messagingService.getMessages(params.id);
    setMessages(data);
    setLoading(false);
    scrollToBottom();
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleTextChange = (text: string) => {
    setNewMessage(text);

    // Emit typing indicator
    if (text.length > 0) {
      socketService.emitTyping(params.id, true);

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        socketService.emitTyping(params.id, false);
      }, 3000);
    } else {
      // Stop typing when input is cleared
      socketService.emitTyping(params.id, false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    // Stop typing indicator
    socketService.emitTyping(params.id, false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    setSending(true);
    const message = await messagingService.sendMessage(params.id, newMessage.trim());

    if (message) {
      setMessages((prev) => [...prev, message]);
      setNewMessage('');
      scrollToBottom();
    }

    setSending(false);
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatLastSeen = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Visto hace un momento';
    if (diffMins < 60) return `Visto hace ${diffMins}m`;
    if (diffHours < 24) return `Visto hace ${diffHours}h`;
    if (diffDays === 1) return 'Visto ayer';
    if (diffDays < 7) return `Visto hace ${diffDays}d`;
    return `Visto ${date.toLocaleDateString('es-ES')}`;
  };

  const getStatusText = () => {
    if (isTyping) return 'Escribiendo...';
    if (isOnline) return 'En línea';
    if (lastSeen) return formatLastSeen(lastSeen);
    return params.role === 'COACH' ? 'Entrenador' : 'Atleta';
  };

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  const shouldShowDateHeader = (index: number) => {
    if (index === 0) return true;
    const currentDate = new Date(messages[index].createdAt).toDateString();
    const previousDate = new Date(messages[index - 1].createdAt).toDateString();
    return currentDate !== previousDate;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.headerNameContainer}>
            <Text style={styles.headerName}>{params.name}</Text>
            {isOnline && <View style={styles.onlineDot} />}
          </View>
          <Text style={[styles.headerRole, isOnline && styles.headerRoleOnline]}>
            {getStatusText()}
          </Text>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={scrollToBottom}
      >
        {messages.map((message, index) => (
          <View key={message.id}>
            {shouldShowDateHeader(index) && (
              <View style={styles.dateHeader}>
                <Text style={styles.dateText}>
                  {formatDateHeader(message.createdAt)}
                </Text>
              </View>
            )}
            <View
              style={[
                styles.messageBubble,
                message.fromId === currentUserId
                  ? styles.messageBubbleSent
                  : styles.messageBubbleReceived,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  message.fromId === currentUserId
                    ? styles.messageTextSent
                    : styles.messageTextReceived,
                ]}
              >
                {message.content}
              </Text>
              <View style={styles.messageFooter}>
                <Text
                  style={[
                    styles.messageTime,
                    message.fromId === currentUserId
                      ? styles.messageTimeSent
                      : styles.messageTimeReceived,
                  ]}
                >
                  {formatMessageTime(message.createdAt)}
                </Text>
                {message.fromId === currentUserId && (
                  <View style={styles.readReceipt}>
                    {message.read ? (
                      <CheckCheck size={14} color="#34C759" />
                    ) : (
                      <Check size={14} color={Colors.gray} />
                    )}
                  </View>
                )}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Escribe un mensaje..."
          placeholderTextColor={Colors.gray}
          value={newMessage}
          onChangeText={handleTextChange}
          multiline
          maxLength={1000}
          editable={!sending}
        />
        <TouchableOpacity
          style={[styles.sendButton, sending && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!newMessage.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={Colors.paper} />
          ) : (
            <Send size={20} color={Colors.paper} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.base,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.paper,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.base,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34C759',
  },
  headerRole: {
    fontSize: 13,
    color: Colors.gray,
    fontWeight: '500',
  },
  headerRoleOnline: {
    color: '#34C759',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    gap: 12,
  },
  dateHeader: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gray,
    backgroundColor: Colors.paper,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 4,
  },
  messageBubbleSent: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.accent,
    borderBottomRightRadius: 4,
  },
  messageBubbleReceived: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.paper,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 4,
  },
  messageTextSent: {
    color: Colors.paper,
  },
  messageTextReceived: {
    color: Colors.text,
  },
  messageTime: {
    fontSize: 11,
    fontWeight: '500',
  },
  messageTimeSent: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  messageTimeReceived: {
    color: Colors.gray,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readReceipt: {
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: Colors.paper,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.base,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
