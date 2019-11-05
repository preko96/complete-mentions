import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MentionInput from './components/mentions-input';
import Tag from './components/tag';

export default function App() {
  const [text, setText] = useState('');

  return (
    <View style={styles.container}>
      <MentionInput style={styles.input} value={text} onChangeText={setText}>
        <Tag
          tag="@"
          extractString={mention => `@[${mention.name}](id:${mention.id})`}
          renderText={mention => <Text style={{ color: 'red' }}>{mention.name}</Text>}
          renderSuggestions={({ tracking, keyword, commit }) =>
            tracking && (
              <TouchableOpacity
                style={styles.button}
                onPress={() => commit({ id: '123', name: 'RED' })}>
                <Text style={styles.text}>{keyword}</Text>
              </TouchableOpacity>
            )
          }
        />
      </MentionInput>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'red',
    flex: 1,
    justifyContent: 'center',
    padding: 10,
  },
  input: {
    padding: 10,
    borderWidth: 1,
    borderColor: 'black',
    backgroundColor: 'white',
  },
  button: {
    padding: 10,
    borderWidth: 2,
    borderColor: 'white',
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
  },
});
