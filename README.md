# Meet-Up Event Planner Submission

## Reviewing the Code

Raw source code is in the [`src/`](src/) folder.

As a learning exercise, I decided to minimize the use of frameworks and libraries, and attempted to create all needed functionality and fallbacks in vanilla JavaScript.

That said, 3rd-party components are used as follows.
- Bootstrap 3 provides foundational styling and utility CSS classes (ex. alerts, error styling).
- Font Awesome provides scalable icons/glyphs.
- jQuery 3 is used only for its promise/deferred implementation (to poly-fill IE).
- Moment and Twix libraries provide humanized dates and times.

## Building the App

A pre-built version is already present in the [`dist/`](dist/) folder.

A build process was implemented using Node (NPM) and Grunt.

- Using `grunt-contrib-htmlmin`, all (local) HTML files were automatically minimized.
- Using `grunt-contrib-cssmin`, all (local) CSS files were automatically joined and minimized.
- Using `grunt-contrib-concat` and `grunt-contrib-uglify`, all (local) JS files were automatically joined and minimized.

If you wish to re-build the app in a compatible environment, follow the steps below.

1. Install [Node](https://nodejs.org/en/download/) and  [Grunt](http://gruntjs.com/installing-grunt).
2. Open a terminal window to the root of the project folder.
3. Install the node modules with the `npm install` command.
4. Build the app with the `grunt` command. The built application will be in the [`dist/`](dist/) folder.

## Running the App

Open [`dist/index.html`](dist/index.html) in a modern browser.

## Using the App

This Single Page App starts up with the login screen displayed, for the convenience of returning users.
To login to the test account, enter any well-formed email address and any password.

To create a new account, click the register button and complete the form.

Once logged in, the list of existing events will display.
Click the `Add Event` button to display the event creation form.
Successfully creating an event will close the event form and display the new event first in the list of events.

Click the `log out` button next to the user avatar to return to the authentication screen.

Refresh the page to reset the app to its initial state.

### Validation

Form input validation occurs on blur and submit.
Each form input group will change color and display an error message if validation fails.
Aria attributes have used to mark invalid fields.

Browsers that do not block invalid form submittal will instead display an alert.
All browsers will show all validation errors if an invalid form submit is attempted.

### Error Handling

Although all user and event data is stored in memory and loaded from hardcoded or input values, the event repository exposes an asynchronous (promise-based) API as one would expect from a real service component.
Any errors encountered attempting to load or save events will display an alert banner, marked up with aria.

### What's Missing From This Incomplete App

- Editing or deleting events, once created, is not supported.
- User inputs are not cleansed for HTML, script, etc. before being added to the data store or rendered in the browser.
- Persistence is limited to the page's lifetime (i.e. is held in memory only).
- No internationalization or localization; password checks, dates and times are en-us centric.
- There are no limits on the number of events displayed (ex. paging very many events).
- The login form does not authenticate the input user credentials; credentials are not stored even within the page's lifetime. Thus there is no error handling for authentication failures due to invalid user credentials (or password reset, etc.).
- Event dates are not validated for proper order (end after start); events may be created for dates in the past.
- There is no input for specifying a user avatar image source.
- Deep-linking (routing) into the SPA's content or state is not supported.

## Attributions

The following sources were used in building the app and/or its execution.

### Images

- Avatar Placeholder: [PlaceKitten](http://placekitten.com)

### Source Code

- Input Dirty Class:  [Google](https://developers.google.com/web/fundamentals/design-and-ui/input/forms/provide-real-time-validation?hl=en)
- Password Validation Regex: [The Art Of Web](http://www.the-art-of-web.com/javascript/validate-password/)
- Element.remove: [Stack Overflow](http://stackoverflow.com/questions/3387427/remove-element-by-id)
- Element.prependChild: [CallMeNick](http://callmenick.com/post/prepend-child-javascript)

### CSS

- Material Design-like Box Shadows: [sdthornton](https://codepen.io/sdthornton/pen/wBZdXq)
- Design Inspiration: [Invision](https://www.invisionapp.com/relate)
