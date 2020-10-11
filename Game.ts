import era = require("./engine/era");
import C = require("./logic/Character/__init__");
import A = require("./logic/Act/__init__");

class page_admin {
    private pages: Function[];
    constructor() {
        this.pages = [];
    }
    goto(func: Function, args?) {
        this.pages.push(func);
        func(args);
    }
    back() {
        this.pages.pop();
        const a = this.pages.pop();
        this.goto(a);
    }
    exit() {
        this.pages = [];
    }
}
namespace pages {
    export function goto(func: Function, args?) {
        pages_admin.goto(func, args);
    }
    export function back() {
        pages_admin.back();
    }
    export function exit() {
        pages_admin.exit();
    }
    export function show_save_to_load(func: Function) {}
    export function show_save_to_save() {}
}
class data_admin {
    characters: C.ca.character_admin;
    constructor() {
        this.characters = new C.ca.character_admin();
    }
}

const version = "Beta 0.0.2";
const pages_admin = new page_admin();
const datas = new data_admin();
async function main(): Promise<void> {
    await era.init();
    pages.goto(ui_start_new_game_set);
}
main();

function ui_title() {
    era.page();
    era.h("eraEQC RE:dream v" + version);
    era.t("with Erera.js v" + era.version);
    era.t();
    era.t();
    era.b("华灯初上", pages.goto, ui_start_game, { popup: "开始游戏" });
    era.t();
    era.t();
    era.b("晨光熹微", pages.exit, { popup: "退出游戏" });
}
function ui_start_game() {
    era.page();
    era.h("夜幕降临");
    era.t();
    era.t("有些倦意了呢");
    era.t();
    era.t("今天会梦见些什么呢？");
    era.t();
    era.t();
    era.b("一枕槐安", pages.goto, ui_start_new_game, {
        popup: "不同于往前的梦",
    });
    era.t();
    era.b("前尘旧梦", pages.goto, ui_start_old_game, {
        popup: "以往梦境的延续",
    });
    era.t();
    era.b("事了无痕", pages.back, { popup: "什么都没有记住" });
}

function ui_start_new_game() {
    function set_new_game_difficulty(num) {
        //setup.game_difficulty(num)
        pages.goto(ui_start_new_game_set);
    }
    era.page();
    era.h("不同于往前的梦境");
    era.t();
    era.t("会是些什么呢？");
    era.t();
    era.b("桃红色的春梦", set_new_game_difficulty, 1, {
        popup: "简单地开始游戏",
        color: "pink",
    });
    era.t();
    era.b("雪青色的寤梦", set_new_game_difficulty, 2, {
        popup: "普通的游戏体验",
        color: "violet",
        disabled: true,
    });
    era.t();
    era.b("刈安色的迷梦", set_new_game_difficulty, 3, {
        popup: "也许会有些困难",
        color: "yellow",
        disabled: true,
    });
    era.t();
    era.b("月白色的狂梦", set_new_game_difficulty, 4, {
        popup: "极具挑战的模式",
        disabled: true,
    });
    era.t();
    era.b("苍蓝的捕梦网", pages.back, {
        popup: "什么都没有记得",
        color: "blue",
    });
}

function ui_start_old_game() {
    era.page();
    pages.show_save_to_load(ui_main);
    era.t();
    era.t();
    era.b("苍蓝的捕梦网", pages.back, {
        popup: "什么都没有记得",
        color: "blue",
    });
}

function ui_start_new_game_set() {
    era.page();
    function start_new_game() {
        datas.characters = new C.ca.character_admin();
        ui_make_chara("玩家");
    }
    era.b("梦境的开端", start_new_game, { popup: "进行玩家属性设置" });
}

function ui_make_chara(ctype = "玩家") {
    function set_temp(keyvalue) {
        temp.set(keyname, keyvalue);
    }
    function make_input(k_str: string) {
        keyname = k_str;
        era.t(String(k_str) + ":  ");
        era.input(set_temp, String(temp.get(keyname)));
        era.t();
    }
    function go_next() {
        datas.characters.add_chara(temp);
        pages.goto(ui_main);
        //页面
    }
    function ui_make_chara_1() {
        //显示属性
        era.page();
        make_input("名字");
        era.b("确定", go_next);
    }

    let keyname = "";
    const temp = new C.ca.character();
    temp.set_default(1,ctype);
    pages.goto(ui_make_chara_1);
}

function ui_main() {
    function target_choose(target_choose: string) {
        c.target = c.charalist[Number(target_choose[1])];
        pages.goto(ui_main);
    }
    function main_save_game() {
        era.page();
        era.h("保存游戏");
        //data.save()
        pages.show_save_to_save();
        era.b("返回", pages.back);
    }
    function main_load_game() {
        era.page();
        era.h("读取游戏");
        pages.show_save_to_load(load_goto);
        era.b("返回", pages.back);
    }
    function load_goto() {
        datas["chara"] = new C.ca.character_admin();
        datas["chara"].load();
        pages.goto(ui_main);
    }
    function main_make_chara() {
        function make_choose(t) {
            choose = t;
        }
        function go_next() {
            if (choose != "") {
                pages.goto(ui_make_chara, choose);
            }
        }
        let choose = "";
        era.page();
        era.h("角色召唤");
        const clist = c.get_chara();
        era.dropdown(clist, make_choose);
        era.b("确定", go_next);
        era.b("返回", pages.back);
    }
    function target_info(id): string {
        const info = "[" + String(id) + "]" + String(c.charalist[id].get("名字"));
        return info;
    }
    function charalist_infos(): Array<string> {
        const infos: Array<string> = [];
        for (const i of c.charalist) {
            infos.push(target_info(i.id));
        }
        return infos;
    }

    const c = datas.characters; //一个常驻的对象，类的全称是character_admin
    era.page();
    const num = c.num();
    c.error_fix();
    era.t("主人" + c.master.get("名字"));
    era.t();
    era.t("助手" + c.assist.get("名字"));
    era.t();
    era.t("目标" + c.target.get("名字"));
    era.t();
    era.t("查看角色：");
    era.dropdown(charalist_infos(), target_choose, target_info(c.target.id));
    era.t();
    era.b("召唤角色", pages.goto, main_make_chara);
    if (c.target.id == 1) {
        era.b("自慰", pages.goto, ui_make_love);
    } else {
        era.b("调教角色", pages.goto, ui_make_love);
    }
    era.b("保存进度", pages.goto, main_save_game);
    era.b("读取进度", pages.goto, main_load_game);
    era.b("返回标题", pages.goto, ui_title);
}

function ui_make_love() {
    function ui_make_love_main() {
        era.page();
        era.b("下一回合", pages.goto, act);
        era.b("结束", pages.goto, ui_main);
    }
    function act() {
        era.page();
        train.work();
        pages.goto(ui_make_love_main);
    }
    const c = datas.characters;
    era.page();
    const train = new A.e.site();

    for (const i of [c.player, c.target, c.assist]) {
        if (i.id != 0) {
            train.add_chara(i);
        }
    }
    train.set_default();
    era.b("开始", pages.goto, ui_make_love_main);
}
