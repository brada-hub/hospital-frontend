import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

export function piniaPlugin({ store }) {
  store.router = useRouter()
  store.$q = useQuasar()
}
