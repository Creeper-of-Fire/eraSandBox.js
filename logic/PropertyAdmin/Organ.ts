import pa_m = require("./Modifier");
import fp = require("../FileParser");
import aa_i = require("../ActAdmin/Insert");
import ca = require("../CharacterAdmin");

export { organ_admin, organ };

class organ_admin {
    //器官模板: string//角色的器官模板，比如human
    private all_organs: Record<string, organ>;
    master: ca.character;

    constructor() {
        //this.器官模板 = 'human'
        this.all_organs = {};
    }

    set_default(master: ca.character): void {
        this.master = master;
        const data = fp.load_yaml(
            fp.OrganDefaultIndex.器官数据定义(master.类型)
        );
        const 器官模板 = String(data["器官模板"]);
        const struct_data = fp.load_yaml(
            fp.OrganDefaultIndex.器官结构定义(器官模板)
        );
        //种族默认器官结构
        const organ_data = data["器官"];
        const insert_data = fp.load_yaml(
            fp.OrganDefaultIndex.插入结构定义(器官模板)
        );
        this.all_organs["全身"] = new organ();
        this.all_organs["全身"].set_default(
            "全身",
            this,
            struct_data,
            organ_data as Record<
                string,
                | string
                | number
                | Record<
                      string,
                      Record<string, Record<string, string | number>>
                  >
            >
        );
        this._insert_default(insert_data);
    }

    push_organ(key: string, val: organ): void {
        this.all_organs[key] = val;
    }
    get_organ(key): organ {
        if (key in this.all_organs) {
            return this.all_organs[key];
        } else {
            return this.null_organ();
        }
    }
    null_organ() {
        const a = new organ();
        return a;
    }
    private _insert_default(insert_data): void {
        function load_map(
            data: Record<string, unknown>,
            organs: Record<string, organ>
        ): void {
            for (const k in organs) {
                organs[k].object_insert.points = [];
            }
            for (const k in data) {
                const posInfo = k.split(",");
                const pos: aa_i.object_insert_point[] = [];
                const rd = Number(data[k]);
                posInfo.forEach((s) => {
                    const m = /^(.*)_(\d+(?:\.\d+)?)$/.exec(s); //魔法代码
                    if (!m) {
                        return;
                    }
                    if (m[1] in organs) {
                        const o = organs[m[1]];
                        const p = new aa_i.object_insert_point();
                        p.set_default(o, Number(m[2]), rd);
                        pos.push(p);
                        o.object_insert.points.push(p);
                    }
                });
                pos.forEach((p1) => {
                    pos.forEach((p2) => {
                        if (p1 == p2) {
                            return;
                        }
                        p1.toward.push(p2);
                    });
                });
            }
        }
        for (const i in this.all_organs) {
            this.all_organs[i].object_insert = new aa_i.object_insert();
            this.all_organs[i].object_insert.set_default(
                this.master,
                this.all_organs[i]
            );
        }
        load_map(insert_data, this.all_organs);
    }
}

//一个角色的organ参与组成以下几种数据结构：
//解剖学树——有序树，是最主要的树，用处：创建成员，进行数据关联，显示给玩家
//通道网——一个图，用处：构成让人插入的结构
class organ {
    name: string;
    private num_data: Record<string, number>;
    private str_data: Record<string, string>;

    private o_admin: organ_admin;
    //本质上，一个角色的所有的organ都是存储在一个一层的dict里面的，以方便外部直接调用彼此
    modifiers: pa_m.modifier_admin;
    //每个organ会有属于自己的修正
    private low_list: organ[];
    //每个organ有它下属organ的指针
    object_insert: aa_i.object_insert;
    //一个镜像器官，掌管插入类

    constructor() {
        this.name = "";

        this.num_data = {
            //'等级': 0,//似乎等级应该单独出来
            经验: 0,
            技巧: 0,
            敏感: 0,
            痛苦: 0,
            扩张: 0, //扩张值，只影响扩张
            快感: 0,
            破坏: 0,
            欲望: 0,
        };
        //初始化相关的数据，即使在战斗中它们也会起作用
        //display_data，直接显示给玩家的数据
    }

    set_default(
        name: string,
        o_admin: organ_admin,
        struct_data: Record<string, any>,
        organ_data: Record<
            string,
            | string
            | number
            | Record<string, Record<string, Record<string, string | number>>>
        >
    ): void {
        this.name = name; //读取来自外部的名字
        this.o_admin = o_admin; //传递自己所在的dict
        this._struct_default(struct_data[name], organ_data); //进行器官结构的默认配置
        this._data_default(organ_data); //进行器官数据的默认配置
    }
    //为上级结构增加的属性会流到如果存在该属性的下级结构中，如果下级结构没有属性则添加给本身
    //如果该结构设置了属性，但是下级结构具有此属性，则当作没有该属性
    private _data_default(organ_data): void {
        if (organ_data == null) {
            return;
        }
        if (!(this.name in organ_data)) {
            return;
        }
        const data = organ_data[this.name];
        for (const key in this.num_data) {
            this.num_data[key] = Number(fp.load_process(data[key]));
        }
        for (const key in this.str_data) {
            this.str_data[key] = String(fp.load_process(data[key]));
        }
    }
    private _struct_default(struct_data, organ_data): void {
        //结构树的默认值
        for (const key in struct_data) {
            const og = new organ(); //创建下属organ
            og.set_default(key, this.o_admin, struct_data, organ_data);
            this.o_admin.push_organ(key, og);
            //向admin添加
        }
    }

    //希望少用
    get(key: string) {
        if (key in this.num_data) {
            return this.get_num(key);
        } else if (key in this.str_data) {
            return this.get_str(key);
        } else {
            return null;
        }
    }
    alt(key: string, val: string | number) {
        if (key in this.num_data) {
            this.alt_num(key, val as number);
        } else if (key in this.str_data) {
            this.alt_str(key, val as string);
        } else {
            null;
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
    alt_str(key: string, val: string) {
        this.str_data[key] = val;
    }

    //数字处理部分，num_data相关
    sum_all() {
        for (const i in this.num_data) {
            this._sum_num(i);
        }
    }
    private _sum_num(key: string): void {
        //汇总
        for (const i_low of this.low_list) {
            i_low._sum_num(key);
        }
        for (const i_low of this.low_list) {
            this.num_data[key] = this.num_data[key] + i_low.get_num(key);
        }
    }
    get_num(key: string): number {
        this._sum_num(key);
        if (key in this.num_data) {
            const g = this.modifiers.add_get(key, this.num_data[key]);
            return g;
        } else {
            return 0;
        }
    }
    alt_num(key: string, val: number): void {
        this._sum_num(key);
        const add_val = val - this.num_data[key];
        this._add_num(key, add_val);
    }
    private _add_num(key: string, val: number): void {
        this._sum_num(key);
        const a = this.modifiers.add_alt(key, val); //获得加成
        let part = 0;
        for (const i_part of this.low_list) {
            //获得下级个数
            if (key in i_part.num_data) {
                part = part + 1;
            }
        }
        if (part == 0) {
            this.num_data[key] = this.num_data[key] + a;
        } else {
            for (const i_part of this.low_list) {
                const add_val = a / part; //未经过加权，直接分配
                i_part._add_num(key, add_val);
            }
        }
    }

    /*
    modifiers_names() {
        return this.modifiers.names()
    }
    quote_modifiers(){
        return this.modifiers
    }
    clone_modifiers(){
        return this.modifiers.clone()
    }
*/

    add_point(position: number, total_aperture: number): void {
        this.object_insert.add_point(position, total_aperture);
    }
    destruction(): number {
        //破坏度，最大100，会查找自己的下级器官，得到破坏度上限
        let part = 0;
        let val = 0;
        this._sum_num("破坏 ");
        if (this.low_list.length == 0) {
            part = 1;
        } else {
            for (const i of this.low_list) {
                part = part + 1;
                val = val + i.destruction();
            }
        }
        const dt = this.num_data["破坏"] / part;
        return dt;
    }
}
