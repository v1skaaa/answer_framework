<script>
export default {
  onLaunch: function () {
    console.log('App Launch')
  },
  onShow: function () {
    console.log('App Show')
  },
  onHide: function () {
    console.log('App Hide')
  }
}
</script>

<template>
  <view>
    <slot></slot>
  </view>
</template>

<style>
/*每个页面公共css */
</style>
