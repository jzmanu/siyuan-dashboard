import {
    Plugin,
    showMessage,
    getFrontend,
    getBackend,
    IModel,
    ICard,
    ICardData,
    IPluginDockTab,
    Menu,
} from "siyuan";
import "@/index.scss";

const STORAGE_NAME = "menu-config";

import Dashboard from './pages/Dashboard.svelte';
import { Logger } from "./utils/mlog";

export default class DashboardPlugin extends Plugin implements IPluginDockTab{
    position: "LeftTop" | "LeftBottom" | "RightTop" | "RightBottom" | "BottomLeft" | "BottomRight";
    size: { width: number; height: number; };
    icon: string;
    hotkey?: string;
    title: string;
    index?: number;
    show?: boolean;

    customTab: () => IModel;
    private isMobile: boolean;

    async onload() {
        Logger.info("DashboardPlugin load.");
        this.data[STORAGE_NAME] = { readonlyText: "Readonly" };
        const frontEnd = getFrontend();
        this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";
        this.addTopBar({
            icon: '<svg t="1732804877272" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="19918" width="300" height="300"><path d="M861.2252 81.37391a81.616736 81.616736 0 0 1 81.373909 81.37391V861.2252a81.616736 81.616736 0 0 1-81.373909 81.373909H162.74782a81.616736 81.616736 0 0 1-81.37391-81.373909V162.74782a81.616736 81.616736 0 0 1 81.37391-81.37391H861.2252m0-81.37391H162.74782A162.882723 162.882723 0 0 0 0 162.74782V861.2252a162.882723 162.882723 0 0 0 162.74782 162.747819H861.2252a162.882723 162.882723 0 0 0 162.747819-162.747819V162.74782A162.720839 162.720839 0 0 0 861.2252 0z" fill="" p-id="19919"></path><path d="M838.453456 613.326167a40.632993 40.632993 0 0 1-40.686955-40.686955 285.779991 285.779991 0 0 0-571.533002 0 40.686955 40.686955 0 0 1-81.37391 0 367.018997 367.018997 0 1 1 734.011014 0 40.228282 40.228282 0 0 1-40.417147 40.686955z" fill="" p-id="19920"></path><path d="M435.36121 745.396886a76.760203 76.760203 0 1 0 76.760203-76.760204 76.760203 76.760203 0 0 0-76.760203 76.760204z" fill="" p-id="19921"></path><path d="M524.883303 772.512529a27.790162 27.790162 0 0 1-19.264248-7.878376 26.980739 26.980739 0 0 1 0-38.258689l179.313994-179.313993a27.061682 27.061682 0 1 1 38.258688 38.258688l-179.287013 179.313994a27.142624 27.142624 0 0 1-19.021421 7.878376z" fill="" p-id="19922"></path></svg>',
            title: this.i18n.helloPlugin,
            callback: (event) => {
                document.documentElement.style.setProperty('--dashboard-width', '1000px');
                document.documentElement.style.setProperty('--dashboard-height', '900px');
                const menu = new Menu('dashboaed');
                const container = document.createElement('div');
                container.id = 'dashboard-container';
                new Dashboard({
                    target: container
                });
                menu.addItem({ element: container });
                const targetDiv = document.querySelector('.b3-menu__item') as HTMLElement;
                targetDiv.style.padding = '0px';
                menu.open({
                    x: event.x,
                    y: event.y,
                  });
            },
        });
    }

    onLayoutReady() {
        Logger.debug(`onLayoutReady > frontend: ${getFrontend()}; backend: ${getBackend()}`);
    }

    async onunload() {
        showMessage(this.i18n.uninstallPlugin);
    }

    async updateCards(options: ICardData) {
        options.cards.sort((a: ICard, b: ICard) => {
            if (a.blockID < b.blockID) {
                return -1;
            }
            if (a.blockID > b.blockID) {
                return 1;
            }
            return 0;
        });
        return options;
    }
}
