# React Native Complete Mentions

A React Native component that let's you mention people in a TextInput like you are used to on Facebook or Twitter.

## Getting started

Install the react-native-complete-mentions package via npm:

```
npm install react-native-complete-mentions --save
```

Or yarn:

```
yarn add react-native-complete-mentions
```

The package exports 2 components

```ts
import { MentionInput, Tag } from 'react-native-complete-mentions';
```

`MentionInput` is the main component rendering the textarea control. It takes one or multiple `Mention` components as its children. Each `Tag` component represents a data source for a specific class of mentionable objects, such as users, template variables, issues, etc.

```tsx
<MentionInput value={this.state.value} onChangeText={this.handleChange}>
  <Tag trigger="@" renderSuggestions={this.renderUserSuggestion} />
  <Tag tag="#" renderSuggestions={this.renderTagSuggestion} />
</MentionInput>
```

## Examples

Expo Snack: https://snack.expo.io/@pr3k0/react-native-complete-mentions-examples

Please find the examples under the `/examples` folder

## Configuration

The `MentionInput` supports the following props for configuring the widget:

| Prop name               | Type              | Default value  | Description                                                                      |
| ----------------------- | ----------------- | -------------- | -------------------------------------------------------------------------------- |
| value                   | string            | `''`           | The value containing markup for mentions                                         |
| onChangeText            | function (string) | empty function | A callback that is invoked when the user changes the value in the mentions input |
| inputRef                | React ref         | undefined      | Accepts a React ref to forward to the underlying input element (optional)        |
| onExtractedStringChange | function (string) | undefined      | Extract the formated text when the displayed input changes. (optional)           |

Each data source is configured using a `Tag` component, which has the following props:

| Prop name            | Type                                     | Default value | Description                                                                                                                                             |
| -------------------- | ---------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| tag                  | string                                   | `'@'`         | Defines the char sequence upon which to trigger querying the data source                                                                                |
| renderText           | function(mention): ReactTextNode         | `null`        | Allows customizing how mentions are displayed.                                                                                                          |
| renderSuggestions    | function ({ tracking, keyword, commit }) | `null`        | Allows customizing how mentions list are rendered (optional)                                                                                            |
| formatText           | function(string): string                 | `null`        | Allows customizing the mentioned text. (optional)                                                                                                       |
| extractString        | function(mention): string                | `null`        | Allows customizing the extracted string, for example `` extractString={mention => `@[${mention.name}](id:${mention.id})`} `` (optional)                 |
| extractCommit        | function(commit)                         | `null`        | Allows you to extract the commit (insert new mention) functionality. (optional)                                                                         |
| detectMentionsRegexp | RegExp                                   | `null`        | Allows parsing predefined text, to parse the mentions in it. should contain match groups for `data` (whole phrase) `name` and optionaly `id` (optional) |
