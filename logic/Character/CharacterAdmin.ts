import I = require("../Item/__init__");
import A = require("../Act/__init__");
import D = require("../Data/__init__");
import C = require("./__init__");

export { character };

class character {
    id: number;
    type: string; //角色的类型，比如“玩家”
    ctrl_able: number;

    acts: A.aa.act_admin;
    modifiers: C.m.modifier_admin;
    organs: C.o.organ_admin;
    equipments: C.em.equipment_admin;
    experiences: C.exp.experience_admin;
    environment: A.e.environment;
    private num_data: Record<string, number>;
    private add_val_temp: Record<string, number>;
    private str_data: Record<string, string>;
    constructor() {
        this.id = 0;
        this.type = "NULL";
        this.ctrl_able = 0;

        this.acts = new A.aa.act_admin();
        this.modifiers = new C.m.modifier_admin();
        this.organs = new C.o.organ_admin();
        this.equipments = new C.em.equipment_admin();
        this.experiences = new C.exp.experience_admin();
        this.environment = new A.e.environment();
        this.num_data = {
            最大体力: 0,
            体力: 0,
            最大精力: 0,
            精力: 0,
            速度: 0,

            高潮次数: 0,

            身高: 0,
            体重: 0,
            胸围: 0,
            腰围: 0,
            臀围: 0,
            //以后这些数据会变成用函数获取的，方便锯掉腿之类的
        };
        this.add_val_temp = {};
        for (const i in this.num_data) {
            this.add_val_temp[i] = 0;
        }
        this.str_data = {
            名字: "",
            种族: "",
        };
        //要展示的数据放在这上面
        //console.log(this);
    }

    set_default(id: number, type: string): void {
        this.id = id;
        this.type = type;
        //this.器官模板 = 器官模板
        const data = D.fp.load_yaml(D.fp.CharacterDefaultIndex.角色数据定义(type));
        this._data_default(data["基础"] as Record<string, number | string>);

        if ("修正" in data) {
            this.modifiers.set_default(
                data["修正"] as Record<string, Record<string, string | number>>
            );
        }
        this.organs.set_default(this, data["器官模板"] as string);
        if (data["器官"] != null) {
            this.organs.data_default(
                data["器官"] as Record<
                    string,
                    Record<
                        string,
                        Record<
                            string,
                            string | number | Record<string, Record<string, string | number>>
                        >
                    >
                >
            );
        }
        this.equipments.set_default(type);
        if ("经历" in data) {
            //利用经历，再进行一次加载
            this.experiences.set_default(data["经历"] as Record<string, string | number>);
            const c = this.experiences.data_list;
            for (const i in c) {
                this.modifiers.set_default(
                    c[i]["修正"] as Record<string, Record<string, string | number>>
                ); //添加修正的时候，是利用了字典的特性来覆盖了之前的修正
                this._data_default(c[i]["基础"] as Record<string, string | number>);
                if (c[i]["器官"] != null) {
                    this.organs.data_default(
                        c[i]["器官"] as Record<
                            string,
                            Record<
                                string,
                                Record<
                                    string,
                                    | string
                                    | number
                                    | Record<string, Record<string, string | number>>
                                >
                            >
                        >
                    );
                }
            }
        }
    }
    private _data_default(data: Record<string, string | number>): void {
        if (data == null) {
            return;
        }
        for (const key in this.num_data) {
            if (key in data) {
                this.num_data[key] =
                    this.num_data[key] +
                    (D.dp.processLoadData(data[key] as string | number) as number);
            } //注意这里是加号，这是为了进行多次配置而进行的改动
        }
        for (const key in this.str_data) {
            if (key in data) {
                this.str_data[key] = D.dp.processLoadData(data[key] as string | number) as string;
            } //对于字符串，后面的配置信息会直接覆盖前面的，所以还请注意
        }
    }

    get(key: string): string | number | null {
        //希望少用
        if (key in this.num_data) {
            return this.get_num(key);
        } else if (key in this.str_data) {
            return this.get_str(key);
        } else {
            return null;
        }
    }
    set(key: string, val: unknown) {
        //只有设置时才使用
        if (key in this.num_data) {
            this.num_data[key] = Number(val);
        } else if (key in this.str_data) {
            this.str_data[key] = String(val);
        } else {
            return;
        }
    }

    //字符串处理
    get_str(key: string): string {
        if (key in this.str_data) {
            return this.str_data[key];
        } else {
            return "";
        }
    }
    set_str(key: string, val: string) {
        this.str_data[key] = val;
    }

    //数字处理部分，num_data相关
    get_num(key: string): number {
        if (key in this.num_data) {
            const g = this.modifiers.add_get(key, this.num_data[key]);
            return g;
        } else {
            return 0;
        }
    }
    add_temp(key: string, val: number): void {
        const a = this.modifiers.add_alt(key, val);
        this.add_val_temp[key] = this.add_val_temp[key] + a;
    }
    //character的add_num_temp只加自己的
    settle(): void {
        this._settle_this();
        this.organs.settle();
    }
    private _settle_this(): void {
        this.modifiers.time_pass();
        if ("时间冻结" in this.modifiers.names) {
            return;
        }
        const a = this.num_data;
        const b = this.add_val_temp;
        for (const i in a) {
            if (b[i] == 0) {
                continue;
            }
            a[i] = a[i] + b[i];
        }
    }
    //character的settle_num只会总结自己的
    private _speak(): Array<string> {
        return;
    }

    insert_able_object_list(): Array<A.i.object_insert> {
        const list_a = this.organs.insert_able_organ_list();
        const list_b = this.equipments.insert_able_part_list();
        const list = list_a.concat(list_b);
        return list;
    }
    insert_able_point_list(): Array<A.i.object_insert_point> {
        const list_a = this.organs.insert_able_point_list();
        const list_b = this.equipments.insert_able_point_list();
        const list = list_a.concat(list_b);
        return list;
    }

    search_object(name: string): C.em.equipment | C.ca.character {
        const a = this.organs.get_organ(name);
        return a;
    }
}
