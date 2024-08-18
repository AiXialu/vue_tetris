# Integrating Vue 2 and Vue 3 Projects with Qiankun as Micro Frontends

This guide will help you modify both Vue 2 and Vue 3 projects to function as micro frontends within the Qiankun framework using Vite and TypeScript. It includes instructions for both versions of Vue, with specific steps to follow for each.

## Prerequisites

Before starting, ensure that you have the following installed:

- Node.js and npm (or yarn)
- A Vue project created with Vite
- Basic knowledge of Vue, TypeScript (for Vue 3), and Vite

---

## Part 1: Integrating a Vue 3 Project with Qiankun

### Step 1: Install Dependencies

First, install the necessary plugin for Vite to work with Qiankun:

```bash
npm install vite-plugin-qiankun --save-dev
```

### Step 2: Update `vite.config.ts`

Modify the `vite.config.ts` file to ensure compatibility between Vite and Qiankun:

```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import qiankun from 'vite-plugin-qiankun';

const useDevMode = true; // Set to `true` during development, `false` for production builds

export default defineConfig({
  plugins: [
    vue(),
    qiankun('vue3App', {
      useDevMode,
    }),
  ],
  build: {
    target: 'esnext',
    minify: false,
    lib: {
      entry: './src/main.ts',
      name: 'vue3App',
      formats: ['umd'],
      fileName: 'vue3-app',
    },
  },
  server: {
    port: 5173,
    cors: true, // Allow cross-origin requests
    origin: 'http://localhost:5173',
  },
});
```

### Step 3: Modify `main.ts`

Next, update the `main.ts` file to support both standalone mode and Qiankun micro frontend mode:

```typescript
import { createApp, App as VueApp } from 'vue';
import App from './App.vue';
import './assets/main.css';
import { renderWithQiankun, qiankunWindow } from 'vite-plugin-qiankun/dist/helper';

let instance: VueApp<Element> | null = null;

function render(props: any = {}) {
  const { container } = props;
  instance = createApp(App);
  instance.mount(container ? container.querySelector('#app') : '#app');
}

// Lifecycle hooks for Qiankun
renderWithQiankun({
  mount(props) {
    console.log('Vue 3 app mounted with Qiankun');
    render(props);
  },
  bootstrap() {
    console.log('Vue 3 app bootstraped with Qiankun');
  },
  unmount(props) {
    console.log('Vue 3 app unmounted with Qiankun');
    if (instance) {
      instance.unmount();
      if (instance._container) {
        instance._container.innerHTML = ''; // Clean up the DOM
      }
      instance = null;
    }
  },
  update(props) {
    console.log('Vue 3 app updated with Qiankun', props);
  },
});

// If not running under Qiankun, render the application standalone
if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render();
}
```

### Step 4: Start Development Server

You can start the Vite development server using:

```bash
npm run dev
```

### Step 5: Build and Serve

For production, build your project with:

```bash
npm run build
```

### Step 6: Integrate with Qiankun Main Application

In your Qiankun main application, register the Vue 3 micro frontend:

```typescript
import { registerMicroApps, start } from 'qiankun';

registerMicroApps([
  {
    name: 'vue3App',
    entry: '//localhost:5173', // Ensure this matches the development or production URL
    container: '#container',
    activeRule: '/app',
  },
]);

start();
```

### Additional Considerations for Vue 3

- **Cross-Origin Issues**: Ensure that your Vite dev server allows cross-origin requests.
- **Development Mode**: Use `vite-plugin-qiankun` to handle Hot Module Replacement (HMR) issues during development.

---

## Part 2: Integrating a Vue 2 Project with Qiankun

### Step 1: Install Qiankun

First, you need to install Qiankun if you haven't already:

```bash
npm install qiankun --save
```

### Step 2: Modify `main.js`

Update your `main.js` file to register your Vue 2 app as a micro frontend with Qiankun:

```javascript
import Vue from 'vue';
import App from './App.vue';
import store from './vuex/store';
import './assets/main.css';

let instance = null;

function render(props = {}) {
  const { container } = props;
  instance = new Vue({
    el: container ? container.querySelector('#app') : '#app',
    render: h => h(App),
    store,
  });
}

if (!window.__POWERED_BY_QIANKUN__) {
  // If not running under Qiankun, render the application standalone
  render();
}

// Lifecycle hooks required by Qiankun
export async function bootstrap() {
  console.log('Vue 2 app bootstraped');
}

export async function mount(props) {
  console.log('Vue 2 app mounted');
  render(props);
}

export async function unmount() {
  console.log('Vue 2 app unmounted');
  if (instance) {
    instance.$destroy();
    instance.$el.innerHTML = ''; // Clean up the DOM
    instance = null;
  }
}
```

### Step 3: Update Webpack Configuration (Optional)

If your Vue 2 project is using Webpack, ensure that the output is set up correctly to work with Qiankun:

```javascript
module.exports = {
  output: {
    library: `${name}-[name]`,
    libraryTarget: 'umd',
    jsonpFunction: `webpackJsonp_${name}`,
  },
};
```

### Step 4: Start Development Server

Run your Vue 2 development server as usual:

```bash
npm run serve
```

### Step 5: Integrate with Qiankun Main Application

In your Qiankun main application, register the Vue 2 micro frontend similarly to Vue 3:

```javascript
import { registerMicroApps, start } from 'qiankun';

registerMicroApps([
  {
    name: 'vue2App',
    entry: '//localhost:8080', // Ensure this matches the development or production URL
    container: '#container',
    activeRule: '/app',
  },
]);

start();
```

### Additional Considerations for Vue 2

- **Webpack Configuration**: Ensure your Webpack output is set to UMD format if needed.
- **Vue CLI**: If you're using Vue CLI, make sure to adjust your configurations to handle Qiankun.
