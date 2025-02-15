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
import { expect, jest } from '@jest/globals'
import { BaseCommand } from '../src/BaseCommand.js'
import { init } from '@adobe/aio-lib-state'
import { stderr } from 'stdout-stderr'

describe('prototype', () => {
  test('args', () => {
    expect(Object.keys(BaseCommand.args)).toEqual([])
  })
  test('flags', () => {
    expect(Object.keys(BaseCommand.flags).sort()).toEqual(['region'])
    expect(BaseCommand.flags.region.options).toEqual(['amer', 'emea', 'apac'])
    expect(BaseCommand.enableJsonFlag).toEqual(true)
  })
})

const mockReadFile = jest.fn()
jest.unstable_mockModule('fs/promises', async () => ({
  readFile: mockReadFile
}))

describe('init', () => {
  let command
  beforeEach(async () => {
    command = new BaseCommand([])
    command.config = {
      runHook: jest.fn().mockResolvedValue({})
    }
    mockReadFile.mockReset()
    mockReadFile.mockResolvedValue(JSON.stringify({
      dependencies: {
        '@adobe/aio-lib-state': '^4',
        '@adobe/aio-sdk': '^6'
      }
    }))
  })

  test('dependencies not declared', async () => {
    command.argv = []
    mockReadFile.mockResolvedValue(JSON.stringify({
      dependencies: {}
    }))
    // ignores
    await expect(command.init()).resolves.toBeUndefined()

    mockReadFile.mockResolvedValue(JSON.stringify({}))
    // ignores
    await expect(command.init()).resolves.toBeUndefined()
  })

  test('package.json not exist', async () => {
    command.argv = []
    mockReadFile.mockRejectedValue('some error')
    // ignores
    await expect(command.init()).resolves.toBeUndefined()
  })

  test('aio-lib-state dependency < 4', async () => {
    command.argv = []
    mockReadFile.mockResolvedValue(JSON.stringify({
      dependencies: { '@adobe/aio-lib-state': '^3' }
    }))
    await expect(command.init()).rejects.toThrow('State commands are not available for legacy State, please migrate to the latest "@adobe/aio-lib-state" (or "@adobe/aio-sdk" >= 6.0.0).')
  })

  test('aio-sdk dependency < 6', async () => {
    command.argv = []
    mockReadFile.mockResolvedValue(JSON.stringify({
      dependencies: { '@adobe/aio-sdk': '^5' }
    }))
    await expect(command.init()).rejects.toThrow('State commands are not available for legacy State, please migrate to the latest "@adobe/aio-lib-state" (or "@adobe/aio-sdk" >= 6.0.0).')
  })

  test('missing namespace', async () => {
    command.argv = []
    global.fakeConfig['runtime.namespace'] = null
    await expect(command.init()).rejects.toThrow('This command is expected to be run in the root of a App Builder app project.\n  Please make sure the \'AIO_RUNTIME_NAMESPACE\' and \'AIO_RUNTIME_AUTH\' environment variables are configured.')
  })

  test('missing auth', async () => {
    command.argv = []
    global.fakeConfig['runtime.auth'] = null
    await expect(command.init()).rejects.toThrow('This command is expected to be run in the root of a App Builder app project.\n  Please make sure the \'AIO_RUNTIME_NAMESPACE\' and \'AIO_RUNTIME_AUTH\' environment variables are configured.')
  })

  test('default', async () => {
    command.argv = []
    await command.init()
    expect(init).toHaveBeenCalledWith({
      region: 'amer',
      ow: { namespace: global.fakeConfig['runtime.namespace'], auth: global.fakeConfig['runtime.auth'] }
    })
  })

  test('config state.region=emea', async () => {
    global.fakeConfig['state.region'] = 'emea'
    command.argv = []
    await command.init()
    expect(init).toHaveBeenCalledWith({
      region: 'emea',
      ow: { namespace: global.fakeConfig['runtime.namespace'], auth: global.fakeConfig['runtime.auth'] }
    })
  })

  test('--region emea', async () => {
    command.argv = ['--region', 'emea']
    await command.init()
    expect(init).toHaveBeenCalledWith({
      region: 'emea',
      ow: { namespace: global.fakeConfig['runtime.namespace'], auth: global.fakeConfig['runtime.auth'] }
    })
  })

  test('config state.endpoint=https://fake.endpoint', async () => {
    global.fakeConfig['state.endpoint'] = 'https://fake.endpoint'
    command.argv = []
    await command.init()
    expect(process.env.AIO_STATE_ENDPOINT).toBe('https://fake.endpoint')
    expect(init).toHaveBeenCalledWith({
      region: 'amer',
      ow: { namespace: global.fakeConfig['runtime.namespace'], auth: global.fakeConfig['runtime.auth'] }
    })
  })

  test('catch error', async () => {
    await command.init()
    await expect(command.catch(new Error('fake error'))).rejects.toThrow('fake error')
  })
  test('catch prompt interrupt', async () => {
    await command.init()
    await expect(command.catch(new Error('jfdsl User force closed the prompt fadsdljf'))).rejects.toThrow('EEXIT: 2')
  })
  test('catch error --json', async () => {
    command.argv = ['--json']
    await command.init()
    await expect(command.catch(new Error('fake error'))).rejects.toThrow('EEXIT: 2')
    expect(stderr.output).toBe('{"error":"fake error"}\n')
  })
})
