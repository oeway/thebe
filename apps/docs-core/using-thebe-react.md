---
title: Using thebe-react
venue: Guides
---

Integrating `thebe-core` into a React based web application presents similar challenges to integrating any stateful 3rd party library that directly manipulates the DOM. The best approach liekly depends on how your applications uses the jupyter backed components and handles concerns like data (notebook) loading, navigation and dynamic rendering. The components in this library represent a good starting point, but you may need to build your own react components on `thebe-core` to acheive the behaviour you want.

The `thebe-react` library uses the React Context API and gives you a set of Providers and hooks that work well in certain setups. One such setup is the demo `create-react-app` application that you can find in [`apps/demo-react`](https://github.com/executablebooks/thebe/tree/main/apps/demo-react), and is an excellent point of reference.

The remainder of this guide will explain the main providers and hooks, and how to use them. We'll follow the shape of the `demo-react` application but will explore all the options included in there. It will also help to review the [`thebe-core`'s underlying API](./using-thebe-core).

```{attention} Help Wanted
:class: dropdown
So far `thebe-react` has been developed with visibility of only a few use cases, with an exploratory focus. In some places, the API is overloaded could be tighter.

Feedback, issues and PR's are very welcome.

```

## Providers

The Context API is used to make the main objects from `thebe-core` available to components in your render tree.

```{tip}
As `thebe-core` makes use of packages and UI components from Juptyer Lab, the providers are setup to dynamically load the libraries. This can be helpful avoid issues with different build systems and Server Side Rendering (SSR).
```

The providers are:

[`ThebeCoreProvider`](#thebecoreprovider)
: Provides a load function and top level configuration object.

[`ThebeServerProvider`](#thebeserverprovider)
: Provides a connect function. Once connect is initiated created, it holds `ThebeServer` object, signals server connection status and provides access to the server API.

[`ThebeSessionProvider`](#thebesessionprovider)
: Provides a `ThebeSession` object, and the means to request one from the current `ThebeServer`. This signals session (kernel) connection status, and provides access to the kernel connection.

### Structuring Providers

Providers need to be structured in cascade within the React component tree.

Once the core library is loaded a server connection can be established, whilst it's possible to have multiple server connections a common pattern is to establish a single server connection high up in your tree, while creating different sessions on different pages within navigation.

```{tip}
In Jupyter Lab and Juptyer notebooks front end implementations, a mapping of 1 session/kernel per document is maintained and this is also the way in whcih `thebe-react` and `thebe-core` are configured by default.

Think about this when deciding how to distribute `ThebeSessions` accross pages/screens in your application. This is important as using a single session across pages means that they are sharing a common kernel,  variable scope, and `ipywidget` manager (See [`Using ipywidgets`](/thebe/using-ipywidgets) for details on thathe latter).
```

A typical provider cascade is:

```{code-block} htmlbars
:caption: How to structure thebe-react` providers within the component tree
<App>
  <ThebeCoreProvider options={options}>
    <ThebeServerProvider>
      ...
      <ThebeSessionProvider name={page.slug}>
        ...
        <MyPageComponent slug={page.slug} />
        ...
      </ThebeSessionProvider>
      ...
    </ThebeServerProvider>
  </ThebeCoreProvider>
</App>
```

We'll go into each provider in more detail below. Note that in the example above we're passing in an options object at the top level, and have tied the creation of sessions into out navigation by using the `page.slug` as the name of the session/kernel.

### ThebeCoreProvider

The `ThebeCoreProvider` interface is:

```typescript
export declare function ThebeCoreProvider(props: {
  start?: boolean;
  children: React.ReactNode;
}): JSX.Element;
```

It accepts a single optional prop:

`start: boolean`
: When set to `true` the provider will load the `thebe-core` library on immediately on render. Subsequent calls to the `load` function will have no effect.

#### hooks

A single convenience hook is available. This will throw on an `undefined` context but otherwise just returns the context value.

```typescript
export declare function useThebeCore(): {
  core?: typeof import('thebe-core') | undefined;
  error?: string | undefined;
  loading: boolean;
  load: () => void;
};
```

`load: () => void`
: Can be used to trigger async loading of the `thebe-core` library by a child component.

`loading: boolean`
: will be `true` during ashync loading.

`error?: string | undefined`
: If an exception occurs, the message will be provided here.

`core?: ThebeCore | undefined`
: When loaded the code module can be accessed here.

### ThebeServerProvider

The `ThebeServerProvider` interface is:

```typescript
export declare function ThebeServerProvider(props: {
  connect: boolean;
  options?: CoreOptions;
  config?: Config;
  events?: ThebeEvents;
  useBinder?: boolean;
  useJupyterLite?: boolean;
  customConnectFn?: (server: ThebeServer) => Promise<void>;
  children: Reacr.Reactnode[];
}): JSX.Element;
```

It's purpose is to hold and instance of a `ThebeServer` and provide access to it. It also subscribes to the error events from the `ThebeServer` and provides error messages to child components via the context value.

It accepts a number of props:

`connect: boolean`
: `connect: true` will cause the provider to connect to a server immediately on render.

`options: CoreOptions`
: Accepts a [`CoreOptions` object](./options.md), that specifies one or more options, defaults are applied for any options not supplied. The options object is used to create a `thebe` configuration object, changes to the options will trigger an update to the configuration object.

`config: Config`
: Accepts an external `Config` object, which if supplied will cause `options` to be ignored **(consider deprecation)**.

`events: ThebeEvents`
: Accepts an exernal `ThebeEvents` object, allowing for custom configuation of the event emitter used in `thebe-core` objects or for sharing of one event emitter accross multiple server connections **(consider deprecation)**.

`useBinder: boolean`
: Will invoke `server.connectToServerViaBinder` to establish a server connection. This takes precedence over `useJuptyerLite` but will have no effect if `customConnectFn` is supplied.

`useJuptyerLite: boolean`
: Will start the in-browser JuptyerLite server but will have no effect if either `useBinder: true` or a `customConnectFn` is provided.

`customConnectFn: (server: ThebeServer) => void`
: Supply a function that can establish a connection for the `server` object provided in the argument. The `server` ojbect will be a fresh instance that should be updated to reflect the state of the server after the connection attempt is complete. One use of this option would be to provision of a server on a Jupyter Hub via an authenitcated API call.

#### hooks

Three convenience hooks are available for use with the provider. Each will throw on an `undefined` context, otherwise returning the object specified:

`useThebeConfig`
: The first will return the configuation object from the server context.

`useDisposeThebeServer`
: On rendering a child component with this hook, the serve will be shutdown (including all sessions) and disposed.

`useThebeServer`
: Provides access to the `server`, status flags and convenience functions allowing child components to interact with the `ThebeServer` object. The return value has the following shape:

```typescript
{
  config: Config;
  events: ThebeEvents;
  server: ThebeServer;
  connecting: boolean;
  ready: boolean;
  error: string | undefined;
  connect: () => void;
  disconnect: () => Promise<void>;
  subscribe: (fn: ListenerFn) => void;
  unsubAll: () => void;
}
```

`config`, `events` and `server` objects
: provides direct access to these objects within the context.

`connecting`, `ready`
: flags showing the connection status.

`error`
: will be set to a message string on any connection error.

`connect`
: Allows child components to establish a server connection

`disconnect`
: Allows child components to trigger disconnection from the server and clean up (dispose) of client side objects.

`subscribe`
: A helper function to add an event listener to the `ThebeEvent`'s emitter that is scoped to this server.

`unsubAll`
: Will unsubscribe all listers that were added via `subscribe`

### ThebeSessionProvider

The `ThebeSessionProvider` interface is:

```typescript
{
  start?: boolean;
  name?: string;
  shutdownOnUnmount?: boolean;
  children: React.ReactNode;
}
```

#### hooks

A single convenience hook is available. This will throw on an `undefined` context but otherwise returns:

```typescript
{
    name: string;
    session?: ThebeSession;
    starting: boolean;
    ready: boolean;
    error?: string;
    start: () => Promise<void>;
    shutdown: () => Promise<void>;
}
```

`name`
: name of the session.

`session`
: The `ThebeSession` instance.

`starting`
: Will be `true` during kernel/session startup.

`ready`
: will be `true` once the session has been successfully started.

`error`
: Will contain the error message if session/kernel start was unsuccessful

`start`
: Request a session/kernel from within a child component. This will only work if a `ThebeServer` is available and ready.

`shutdown`
: Trigger shudown of the current session.
