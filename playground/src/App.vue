<script setup lang="ts">
import { Designer } from '@dragcraft/designer'
import { fieldComponents } from './field-components'
import { widgetDefinitions } from './widgets'

const designerOptions = {
  widgets: widgetDefinitions,
}
</script>

<template>
  <Designer :options="designerOptions" :field-components="fieldComponents" />
</template>
