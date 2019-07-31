import { NullEventAction, EventType, LogEventAction, LogResponseStatus, TypeEventTypeAction, EventMessage } from "./model/EventMessage";
import { EventLoggingServiceClient } from "./transport/EventLoggingServiceClient";

const Logger = require('@mojaloop/central-services-shared').Logger

interface IEventRecorder {
  recorder: EventLoggingServiceClient | Function
  preProcess: (event: EventMessage) => EventMessage
  postProcess: (result: any) => any
  record: (event: EventMessage) => Promise<any>
}

class DefaultLoggerRecorder implements IEventRecorder {
  recorder: Function = Logger

  preProcess = (event: EventMessage): EventMessage => {
    return event
  }

  postProcess = (result: any): any => {
    return result
  }

  async record(event: EventMessage): Promise<any> {
    let updatedEvent = this.preProcess(event)
    let result = await this._log(updatedEvent)
    return this.postProcess(result)
  }

  private async _log (message: EventMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        let type: TypeEventTypeAction['type']
        let action: TypeEventTypeAction['action']
        if (message.metadata && message.metadata.event) {
          type = message.metadata.event.type!
          action = message.metadata.event.action!
        } else {
          type = EventType.log
          action = LogEventAction.info
        }
        if (type === EventType.log && Object.values(LogEventAction).includes(action)) 
          Logger.log(action, JSON.stringify(message, null, 2))
        else 
          Logger.log(type, JSON.stringify(message, null, 2))
        resolve({ status: LogResponseStatus.accepted })
      } catch(e) {
        reject({status: LogResponseStatus.error, error: e})
      }
    })
  }
}

class DefaultSidecarRecorder implements IEventRecorder {
  recorder: EventLoggingServiceClient

  constructor(recorder: EventLoggingServiceClient) {
    this.recorder = recorder
    return this
  }

  preProcess = (event: EventMessage): EventMessage => {
    return event
  }

  postProcess = (result: any): any => {
    return result
  }

  async record(event: EventMessage): Promise<any> {
    let updatedEvent = this.preProcess(event)
    let result = await this.recorder.log(updatedEvent)
      return this.postProcess(result)
  }
}

export {
  DefaultLoggerRecorder,
  DefaultSidecarRecorder,
  IEventRecorder
}
