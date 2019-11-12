import * as React from 'react';
import { Text, View, StyleSheet, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';

import { MentionInput, Tag } from 'react-native-complete-mentions';

const suggestedUsers = [{ name: 'John', id: 1 }, { name: 'Eve', id: 2 }];

function UserSuggestion({ name, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.userSuggestionContainer}>
      <Text>{name}</Text>
    </TouchableOpacity>
  );
}

/*
  This solution shows how to render the suggestions outside of the component
*/

export default function Extracted() {
  const [value, setValue] = React.useState('');
  const [keyword, setKeyword] = React.useState('');
  const [tracking, setTracking] = React.useState(false);
  const [extractedValue, setExtractedValue] = React.useState('');

  React.useEffect(() => {
    console.log(extractedValue);
  }, [extractedValue]);

  const commitRef = React.useRef();
  const extractCommit = commit => {
    commitRef.current = commit;
  };

  const renderSuggestedUsers = () => {
    if (!tracking || keyword === '') return null;
    return suggestedUsers.map(user => (
      <UserSuggestion
        name={user.name}
        id={user.id}
        onPress={() => {
          if (commitRef.current) {
            commitRef.current({ name: user.name, id: user.id });
          }
        }}
      />
    ));
  };

  return (
    <View style={styles.container}>
      <MentionInput
        value={value}
        onChangeText={setValue}
        onExtractedStringChange={setExtractedValue}
        style={styles.input}>
        <Tag
          tag="@"
          onKeywordChange={setKeyword}
          onStopTracking={() => setTracking(false)}
          onStartTracking={() => setTracking(true)}
          extractCommit={extractCommit}
          renderText={mention => <Text style={styles.userText}>{mention.name}</Text>}
          formatText={text => `@${text}`}
          extractString={mention => `@[${mention.name}](id:${mention.id})`}
        />
      </MentionInput>
      {renderSuggestedUsers()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    justifyContent: 'center',
  },
  input: {
    padding: 5,
    borderWidth: 1,
    borderColor: 'red',
  },
  userSuggestionContainer: {
    padding: 10,
    borderWidth: 2,
    borderColor: 'blue',
    marginBottom: 2,
  },
  userText: {
    fontWeight: 'bold',
    color: 'blue',
  },
});
