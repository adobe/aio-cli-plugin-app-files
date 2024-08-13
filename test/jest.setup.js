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
import { jest } from '@jest/globals'
import { stdout, stderr } from 'stdout-stderr'
import config from '@adobe/aio-lib-core-config'

jest.setTimeout(10000)

// NOTE: if not wrapped in beforeAll/afterAll this may end up timing out random tests.... jest bug?
beforeAll(async () => {
  jest
    .useFakeTimers({ advanceTimers: true })
    .setSystemTime(new Date('2000-01-01'))
})
afterAll(async () => {
  jest.useRealTimers()
})

// mock config
config.get = (key) => {
  return global.fakeConfig[key] || null
}

// mock state
const mockInit = jest.fn()
const mockInstance = {
  get: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  stats: jest.fn(),
  list: jest.fn(),
  any: jest.fn(),
  deleteAll: jest.fn()
}
jest.unstable_mockModule('@adobe/aio-lib-state', () => ({
  init: mockInit
}))
global.getStateInstanceMock = () => mockInstance

// mock prompt
const mockPrompt = {
  input: jest.fn()
}
jest.unstable_mockModule('@inquirer/prompts', () => ({
  ...mockPrompt
}))
global.getPromptInstanceMock = () => mockPrompt

beforeEach(() => {
  // trap console log
  stdout.start()
  stderr.start()

  // config fakes
  global.fakeConfig = {
    'state.region': null,
    'runtime.namespace': '11111-ns',
    'runtime.auth': 'auth',
    'state.endpoint': null
  }
  delete process.env.AIO_STATE_ENDPOINT

  mockInit.mockReset()
  mockInit.mockResolvedValue(mockInstance)
  Object.values(mockInstance).forEach(mock => mock.mockReset())

  Object.values(mockPrompt).forEach(mock => mock.mockReset())
})
afterEach(() => { stdout.stop(); stderr.stop() })
