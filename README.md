# Advanced Cursors

Advanced Cursors adds new commands to Obsidian which let you take more advantage of [multiple cursors](https://help.obsidian.md/How+to/Working+with+multiple+cursors).

## Commands

### Move to next instance of current selection

This command takes the text you currently have selected, and moves the cursor to the next instance of that same text.

![](Assets/cursors-readme1.gif)

### Add next instance of current selection to selections

This command does mostly the same as the previous, except it keeps your previous cursors in place.

This does the same thing as `Ctrl + d` in VS Code.

![](Assets/cursors-readme2.gif)

### Open Regex match modal

This command allows even more fine-grained control of where you place the cursor.

When you open the modal, you will see a text input field, and submit button, and an option to toggle `Regex?`.

![](https://i.imgur.com/hCI4VBE.png)

Enter a search query into the input field, and Advanced Cursors will place a cursor at each place in the current document that matches the query.

Toggle `Regex?` for the query to be treated as a regex, or a string literal.

![](Assets/cursors2.gif)
