import { createApp } from 'vue';
import App from './App.vue';
import './assets/main.css';
import { renderWithQiankun, qiankunWindow } from 'vite-plugin-qiankun/dist/helper';

let instance: VueApp<Element> | null = null;

function render(props: any = {}) {
    const { container } = props;
    instance = createApp(App);
    instance.mount(container ? container.querySelector('#app') : '#app');
}

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
    }
});

// If not running under Qiankun, render the application standalone
if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
    render();
}
