import fp = require("../FileParser");

export { modifier_admin };

class modifier_admin {
    private modifiers: Record<string, modifier>;
    constructor() {
        this.modifiers = {};
    }
    set_default(类型): void {
        const data: Record<string, Record<string, string>> = fp.load_yaml(
            fp.ModifierDefaultIndex.角色配置(类型)
        )["修正"] as Record<string, Record<string, string>>;
        for (const i in data) {
            for (const j in data[i]) {
                const a = fp.load_process(data[i][j]);
                if (a != 0) {
                    const b = this.type(i);
                    this.modifiers[j] = new b();
                    this.modifiers[j].set_default();
                }
            }
        }
    }

    add_get(key: string, val: number): number {
        function g_add(key: string): number {
            let add = 0;
            for (const i in this.modifiers) {
                if (key in this.modifiers[i].get_add) {
                    add = add + this.modifiers[i].get_add[key];
                }
            }
            return add;
        }
        function g_mlt(key: string): number {
            let mlt = 1;
            for (const i in this.modifiers) {
                if (key in this.modifiers[i].get_mlt) {
                    mlt = mlt * this.modifiers[i].get_mlt[key];
                }
            }
            return mlt;
        }
        //add_get是在get时提供修正，不影响原值
        const a = (val + g_add(key)) * g_mlt(key);
        return a;
    }
    add_alt(key: string, val: number): number {
        function a_add(key: string): number {
            let add = 0;
            for (const i in this.modifiers) {
                if (key in this.modifiers[i].alt_add) {
                    add = add + this.modifiers[i].alt_add[key];
                }
            }
            return add;
        }
        function a_mlt(key: string): number {
            let mlt = 1;
            for (const i in this.modifiers) {
                if (key in this.modifiers[i].alt_mlt) {
                    mlt = mlt * this.modifiers[i].alt_mlt[key];
                }
            }
            return mlt;
        }
        //add_alt是在add时提供修正，会影响“加上去的值”
        const a = (val + a_add(key)) * a_mlt(key);
        return a;
    }
    names(): string[] {
        const a: string[] = [];
        for (const i in this.modifiers) {
            a.push(i);
        }
        return a;
    }
    type(val: string) {
        switch (val) {
            case "modifier":
                return modifier;
            case "attach":
                return attach;
            case "destruction":
                return destruction;
            case "insert":
                return insert;
            default:
                return modifier;
        }
    }
    /*
    clone(): modifier_admin {
        const a = new modifier_admin();
        for (const i in this.modifiers) {
            a.modifiers[i] = JSON.parse(JSON.stringify(this.modifiers[i]));
        }
        return a;
    }
    */
}

class modifier {
    name: string;
    get_add: Record<string, number>;
    get_mlt: Record<string, number>;
    alt_add: Record<string, number>;
    alt_mlt: Record<string, number>;

    constructor() {
        this.get_add = {};
        this.get_mlt = {};
        this.alt_add = {};
        this.alt_mlt = {};
    }
    set_default(): void {
        const data = fp.load_yaml(fp.ModifierDefaultIndex.配置文件);
        if (this.name in data) {
            this.get_add = data[this.name]["g_add"];
            this.get_mlt = data[this.name]["g_mlt"];
            this.alt_add = data[this.name]["a_add"];
            this.alt_mlt = data[this.name]["a_mlt"];
        }
    }

    work(): void {}
}
class attach extends modifier {
    constructor() {
        super();
    }
    contaminate(): void {} //液体沾染
}

class destruction extends modifier {
    constructor() {
        super();
    }
}

class insert extends modifier {
    constructor() {
        super();
    }
}
