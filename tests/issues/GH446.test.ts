import { v4, parse, stringify } from 'uuid';
import { Entity, ManyToOne, MikroORM, OneToOne, PrimaryKey, PrimaryKeyType, Property, Type, wrap } from '@mikro-orm/core';
import { MySqlDriver, SchemaGenerator } from '@mikro-orm/mysql';

export class UuidBinaryType extends Type<string, Buffer> {

  convertToDatabaseValue(value: string): Buffer {
    return Buffer.from(parse(value) as number[]);
  }

  convertToJSValue(value: Buffer): string {
    return stringify(value);
  }

  getColumnType(): string {
    return 'binary(16)';
  }

}

@Entity()
class A {

  @PrimaryKey({ type: UuidBinaryType })
  id: string = v4();

  @Property({ nullable: true })
  name?: string;

}

@Entity()
class B {

  @OneToOne({ primary: true })
  a!: A;

}

@Entity()
class C {

  @OneToOne({ primary: true })
  b!: B;

  [PrimaryKeyType]: B | A | string;

}

@Entity()
class D {

  @PrimaryKey({ type: UuidBinaryType })
  id: string = v4();

  @ManyToOne()
  a!: A;

}

describe('GH issue 446', () => {

  let orm: MikroORM<MySqlDriver>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      entities: [A, B, C, D],
      dbName: `mikro_orm_test_gh_446`,
      type: 'mysql',
      port: 3307,
    });
    await new SchemaGenerator(orm.em).ensureDatabase();
    await new SchemaGenerator(orm.em).dropSchema();
    await new SchemaGenerator(orm.em).createSchema();
  });

  afterAll(async () => {
    await orm.close(true);
  });

  test(`chaining primary key column type`, async () => {
    const a = new A();
    const b = new B();
    b.a = a;
    const c = new C();
    c.b = b;
    const d = new D();
    d.a = a;
    await orm.em.persistAndFlush([c, d]);
    orm.em.clear();

    const c1 = await orm.em.findOneOrFail(C, c.b.a.id, ['b.a']);
    expect(c1).toBeInstanceOf(C);
    expect(c1.b).toBeInstanceOf(B);
    expect(wrap(c1.b).isInitialized()).toBe(true);
    expect(c1.b.a).toBeInstanceOf(A);
    expect(wrap(c1.b.a).isInitialized()).toBe(true);
    expect(c1.b.a.id).toBe(a.id);
  });

  test(`assign with custom types`, async () => {
    const d = new D();
    orm.em.assign(d, { id: Buffer.from(parse(v4()) as number[]) as any, a: Buffer.from(parse(v4()) as number[]) }, { convertCustomTypes: true });
    expect(typeof d.id).toBe('string');
    expect(typeof d.a.id).toBe('string');
    orm.em.assign(d, { id: v4(), a: v4() });
    expect(typeof d.id).toBe('string');
    expect(typeof d.a.id).toBe('string');
    orm.em.assign(d, { id: v4(), a: { id: v4(), name: 'abc' } });
    expect(typeof d.id).toBe('string');
    expect(typeof d.a.id).toBe('string');
    expect(d.a.name).toBe('abc');
  });

  test('merging cached entity', async () => {
    const a1 = new A();
    a1.name = 'test';
    expect(typeof a1.id).toBe('string');
    // simulate caching by converting to JSON and back to POJO
    const cache = JSON.parse(JSON.stringify(wrap(a1).toObject()));
    expect(typeof cache.id).toBe('string');
    const a2 = orm.em.getRepository(A).merge(cache);
    expect(typeof a2.id).toBe('string');
    expect(a2.name).toBe('test');
  });

});
