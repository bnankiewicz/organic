---
to: _devscreen/screens/<%= moduleName %>/<%= h.changeCase.pascal(name) %>.tsx
---
import React from 'react'
import <%= h.changeCase.pascal(name) %> from 'screens/<%= moduleName %>/<%= h.changeCase.pascal(name) %>';

export default function <%= h.changeCase.pascal(name) %>DevScreen() {
  return (
    <<%= h.changeCase.pascal(name) %> />
  )
}