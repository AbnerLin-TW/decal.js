/**
Define a belongsTo relationship.

@method belongsTo
@param  {String} modelKey The modelKey of the relationship.
@param  {Object} opts Options for the relationship.
@return {ComputedProperty}
*/

'use strict'

const get = require('../utils/get')
const set = require('../utils/set')
const computed = require('../utils/computed')

module.exports = function make (mKey, opts) {
  opts = opts || {}

  let belongsTo = computed({

    get (key) {
      let meta = this.__meta
      let val = null

      if (typeof this.__meta.data[key] === 'undefined') {
        if (typeof opts.defaultValue !== 'undefined') val = opts.defaultValue
        if (typeof val !== 'undefined') meta.data[key] = val
      }

      return meta.data[key]
    },

    set (val, key) {
      let meta = this.__meta
      let store = this.store
      let dirty = get(this, 'dirtyAttributes')
      let data = meta.data
      let pristine = meta.pristineData

      if (dirty) {
        if (typeof pristine[key] !== 'undefined') {
          let dirtyIdx = dirty.indexOf(key)
          if (pristine[key] === val && ~dirtyIdx) dirty.splice(dirtyIdx, 1)
          else if (!~dirtyIdx) dirty.push(key)
        } else {
          pristine[key] = typeof data[key] !== 'undefined' ? data[key] : opts.defaultValue
          dirty.push(key)
        }
      }

      if (val) {
        if (store && !(val instanceof store.__registry[mKey])) {
          if (typeof val !== 'string' && typeof val !== 'number') val = String(val)
          val = store.find(mKey, val)
        }
      } else val = null
      data[key] = val
    }
  })

  belongsTo.meta({

    type: 'belongsTo',
    isRelationship: true,
    opts: opts,
    relationshipKey: mKey,

    serialize (filter, dirty) {
      let key,
        val,
        meta,
        store

      meta = belongsTo.meta()
      key = meta.key
      store = this.store

      val = get(this, key)

      if (val && val instanceof store.__registry[mKey]) val = get(val, 'pk')
      if (!filter || filter(meta, key, val)) return val
    },

    serializeDirty (filter) {
      return belongsTo.meta().serialize.call(this, filter, true)
    },

    deserialize (val, override, filter, resetDirty = true) {
      let meta = belongsTo.meta()
      let key = meta.key

      set(this, key, val)
      return val
    },

    revert (revertRelationships) {
      let val = get(this, belongsTo.meta().key)
      if (val) val.revert(revertRelationships)
    }
  })

  belongsTo.clone = function () {
    return make(mKey, opts)
  }

  return belongsTo
}
