/*
Copyright 2024 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import { expect } from '@jest/globals'
import { execa } from 'execa'

const uniqueToken = Date.now() + Math.floor(Math.random() * 10)
test('state put get list delete', async () => {
  const key = `test.cli.${uniqueToken}`
  const value = '0123456789'

  const putRes = await execa('./bin/run.js', ['app', 'state', 'put', key, value])
  expect(putRes.stdout).toEqual(key)
  const getRes = await execa('./bin/run.js', ['app', 'state', 'get', key])
  expect(getRes.stdout).toEqual(value)
  const listRes = await execa('./bin/run.js', ['app', 'state', 'list', '--json', '--match', 'test.cli.*'])
  expect(JSON.parse(listRes.stdout)).toContain(key)
  const deleteRes = await execa('./bin/run.js', ['app', 'state', 'delete', key, '--json'])
  expect(JSON.parse(deleteRes.stdout)).toEqual({ keys: 1 })
})
