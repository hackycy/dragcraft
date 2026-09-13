import type { MaterialDefinition } from '@dragcraft/designer'

import { carouselMaterial } from './materials/Carousel'
import { dividerMaterial } from './materials/Divider'
import { floatingButtonMaterial } from './materials/FloatingButton'
import { imageMaterial } from './materials/Image'
import { navBarMaterial } from './materials/NavBar'
import { navigationGroupMaterial } from './materials/NavigationGroup'
import { noticeMaterial } from './materials/Notice'
import { spacerMaterial } from './materials/Spacer'
import { tabBarMaterial } from './materials/TabBar'
import { titleMaterial } from './materials/Title'

/**
 * playground 没有页面概念，所以 prod 的 `material-registry.ts` 那一整套页面策略
 * （`all`/`fixed`、固定物料包装、`decorationMode`、页面排除）在这里全部塌掉：
 * 所有物料扁平注册，面板可见，没有"系统维护的物料"。
 *
 * 分组常量在同目录的 `materials/groups.ts`，不要搬到这里——物料要读它，会成环。
 */
export const DECORATION_MATERIALS: readonly MaterialDefinition[] = [
  navBarMaterial,
  imageMaterial,
  carouselMaterial,
  navigationGroupMaterial,
  noticeMaterial,
  tabBarMaterial,
  dividerMaterial,
  spacerMaterial,
  titleMaterial,
  floatingButtonMaterial,
]
