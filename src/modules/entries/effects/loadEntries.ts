import { call, put, select } from 'redux-saga/effects'
import { entriesActions, entriesSelectors } from 'modules/entries/index'

export default function*(action: ReturnType<typeof entriesActions.loadEntries.request>): Generator {
  console.tron.error('Effect loadEntries not implemented')
}