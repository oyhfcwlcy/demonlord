/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class DemonlordItemSheet extends ItemSheet {
  /** @override */
  static get defaultOptions () {
    return mergeObject(super.defaultOptions, {
      classes: ['demonlord', 'sheet', 'item'],
      width: 520,
      height: 520,
      tabs: [
        {
          navSelector: '.sheet-tabs',
          contentSelector: '.sheet-body',
          initial: 'attributes'
        }
      ]
    })
  }

  /** @override */
  get template () {
    const path = 'systems/demonlord/templates/item'
    return `${path}/item-${this.item.data.type}-sheet.html`
  }

  /* -------------------------------------------- */

  /** @override */
  getData () {
    const data = super.getData()
    return data
  }

  /* -------------------------------------------- */

  /** @override */
  setPosition (options = {}) {
    const position = super.setPosition(options)
    const sheetBody = this.element.find('.sheet-body')
    const bodyHeight = position.height - 192
    sheetBody.css('height', bodyHeight)
    return position
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners (html) {
    super.activateListeners(html)

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return

    html.find('.radiotrue').click((ev) => {
      this.updateOption(true)
    })

    html.find('.radiofalse').click((ev) => {
      this.updateOption(false)
    })
  }

  /**
   * This method is called upon form submission after form data is validated
   * @param event {Event}       The initial triggering submission event
   * @param formData {Object}   The object of validated form data with which to update the object
   * @private
   */
  async _updateObject (event, formData) {
    const item = this.object
    const updateData = expandObject(formData)

    if (item.type == 'talent') {
      // If a Talent has no uses it's always active
      if (
        (updateData.data?.uses?.value == '' &&
          updateData.data?.uses?.max == '') ||
        (updateData.data?.uses?.value == '0' &&
          updateData.data?.uses?.max == '0')
      ) {
        await this.object.update({
          'data.addtonextroll': true
        })

        const characterbuffs = this.generateCharacterBuffs()
        await this.actor.update({
          'data.characteristics.defensebonus': parseInt(
            characterbuffs.defensebonus
          ),
          'data.characteristics.healthbonus': parseInt(
            characterbuffs.healthbonus
          ),
          'data.characteristics.speedbonus': parseInt(characterbuffs.speedbonus)
        })
      } else {
        await this.entity.update({
          'data.addtonextroll': false
        })
      }
    }

    return this.entity.update(updateData)
  }

  generateCharacterBuffs () {
    const characterbuffs = new CharacterBuff()
    characterbuffs.challengestrengthbonus = 0
    characterbuffs.challengeagilitybonus = 0
    characterbuffs.challengeintellectbonus = 0
    characterbuffs.challengewillbonus = 0
    characterbuffs.challengeperceptionbonus = 0

    const talents = this.actor
      .getEmbeddedCollection('OwnedItem')
      .filter((e) => e.type === 'talent')

    for (const talent of talents) {
      if (talent.data.addtonextroll) {
        if (
          this.actor.data.data.activebonuses ||
          (talent.data.uses.value > 0 && talent.data.uses.max > 0)
        ) {
          if (
            talent.data.bonuses?.defenseactive &&
            talent.data.bonuses?.defense > 0
          ) {
            characterbuffs.defensebonus += parseInt(talent.data.bonuses.defense)
          }
          if (
            talent.data.bonuses?.healthactive &&
            talent.data.bonuses?.health > 0
          ) {
            characterbuffs.healthbonus += parseInt(talent.data.bonuses.health)
          }
          if (
            talent.data.bonuses?.speedactive &&
            talent.data.bonuses?.speed > 0
          ) {
            characterbuffs.speedbonus += parseInt(talent.data.bonuses.speed)
          }
          if (
            talent.data.bonuses?.poweractive &&
            talent.data.bonuses?.power > 0
          ) {
            characterbuffs.powerbonus += parseInt(talent.data.bonuses.power)
          }
        }
      }
    }
    return characterbuffs
  }

  async updateOption (selected) {
    await this.object.update({
      'data.level4.option1': selected
    })
  }
}
