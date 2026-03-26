import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';

export default function ChatScreen() {
  const route      = useRoute();
  const navigation = useNavigation();
  const { user }   = useAuth();

  const { friendId, friendName, friendAvatar } = route.params || {};

  const [messages,  setMessages]  = useState([]);
  const [text,      setText]      = useState('');
  const [loading,   setLoading]   = useState(true);
  const [sending,   setSending]   = useState(false);
  const flatRef    = useRef(null);
  const pollRef    = useRef(null);

  const loadMessages = useCallback(async () => {
    try {
      const { data } = await api.get(`/social/messages/${friendId}`);
      setMessages(data ?? []);
    } catch {
      // ignore poll errors
    }
  }, [friendId]);

  useEffect(() => {
    navigation.setOptions({ title: friendName || 'Chat' });
    loadMessages().finally(() => setLoading(false));
    pollRef.current = setInterval(loadMessages, 5000);
    return () => clearInterval(pollRef.current);
  }, [loadMessages, navigation, friendName]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const send = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setText('');
    try {
      const { data } = await api.post('/social/messages', {
        receiver_id: parseInt(friendId, 10),
        content,
      });
      setMessages(prev => [...prev, data]);
    } catch {
      setText(content);
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item: msg }) => {
    const isMe = msg.sender_id === user?.id;
    const time = new Date(msg.created_at).toLocaleTimeString(undefined, {
      hour: '2-digit', minute: '2-digit',
    });
    return (
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
        <Text style={isMe ? styles.bubbleMeText : styles.bubbleThemText}>{msg.content}</Text>
        <Text style={[styles.timestamp, isMe ? styles.timestampMe : styles.timestampThem]}>
          {time}{isMe ? (msg.is_read ? '  ✓✓' : '  ✓') : ''}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* Friend header */}
      <View style={styles.header}>
        <Text style={styles.headerAvatar}>{friendAvatar || '👤'}</Text>
        <View>
          <Text style={styles.headerName}>{friendName || 'Freund'}</Text>
          <Text style={styles.headerOnline}>Online</Text>
        </View>
      </View>

      {/* Messages */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6d28d9" />
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>{friendAvatar || '👤'}</Text>
          <Text style={styles.emptyText}>Starte das Gespräch mit {friendName}!</Text>
        </View>
      ) : (
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={m => String(m.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Nachricht…"
          placeholderTextColor="#94a3b8"
          maxLength={1000}
          multiline
          returnKeyType="send"
          onSubmitEditing={send}
          blurOnSubmit
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
          onPress={send}
          disabled={!text.trim() || sending}
          activeOpacity={0.7}
        >
          <Text style={styles.sendBtnText}>{sending ? '…' : '➤'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:              { flex: 1, backgroundColor: '#0f172a' },
  header:            {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#1e293b', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#334155',
  },
  headerAvatar:      { fontSize: 28 },
  headerName:        { fontSize: 15, fontWeight: '700', color: '#f8fafc' },
  headerOnline:      { fontSize: 12, color: '#4ade80', marginTop: 1 },
  center:            { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyEmoji:        { fontSize: 48, marginBottom: 12 },
  emptyText:         { fontSize: 14, color: '#94a3b8', textAlign: 'center', paddingHorizontal: 24 },
  messageList:       { paddingVertical: 12, paddingHorizontal: 12 },
  bubble:            { maxWidth: '75%', marginVertical: 3, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18 },
  bubbleMe:          { alignSelf: 'flex-end', backgroundColor: '#4f46e5', borderBottomRightRadius: 4 },
  bubbleThem:        { alignSelf: 'flex-start', backgroundColor: '#334155', borderBottomLeftRadius: 4 },
  bubbleMeText:      { color: '#fff', fontSize: 14 },
  bubbleThemText:    { color: '#e2e8f0', fontSize: 14 },
  timestamp:         { fontSize: 10, marginTop: 3 },
  timestampMe:       { color: '#a5b4fc', textAlign: 'right' },
  timestampThem:     { color: '#64748b' },
  inputRow:          {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    backgroundColor: '#1e293b', borderTopWidth: 1, borderTopColor: '#334155',
    paddingHorizontal: 12, paddingVertical: 10,
  },
  input:             {
    flex: 1, backgroundColor: '#334155', color: '#f8fafc',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14, maxHeight: 100,
  },
  sendBtn:           {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled:   { backgroundColor: '#334155' },
  sendBtnText:       { color: '#fff', fontSize: 18 },
});
