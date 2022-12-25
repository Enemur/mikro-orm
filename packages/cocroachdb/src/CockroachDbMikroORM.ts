import { defineConfig, MikroORM } from '@mikro-orm/core';
import type { Options } from '@mikro-orm/core';
import { CockroachDbDriver } from './CockroachDbDriver';

/**
 * @inheritDoc
 */
export class CockroachDbMikroORM extends MikroORM<CockroachDbDriver> {

  private static DRIVER = CockroachDbDriver;

}

export type PostgreSqlOptions = Options<CockroachDbDriver>;

/* istanbul ignore next */
export function definePostgreSqlConfig(options: PostgreSqlOptions) {
  return defineConfig({ driver: CockroachDbDriver, ...options });
}
