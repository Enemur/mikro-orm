import type { Configuration } from '@mikro-orm/core';
import { AbstractSqlDriver } from '@mikro-orm/knex';
import { CockroachDbConnection } from './CockroachDbConnection';
import { CockroachDbPlatform } from './CockroachDbPlatform';

export class CockroachDbDriver extends AbstractSqlDriver<CockroachDbConnection> {

  constructor(config: Configuration) {
    super(config, new CockroachDbPlatform(), CockroachDbConnection, ['knex', 'pg']);
  }

}
