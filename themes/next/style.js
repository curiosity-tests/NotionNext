/* eslint-disable react/no-unknown-property */
import CONFIG from './config'
import { themeConsoleStyle } from '@/lib/themeConsoleStyle'
/**
 * 此处样式只对当前主题生效
 * 此处不支持tailwindCSS的 @apply 语法
 * @returns
 */
const Style = () => {
  return (
    <style jsx global>{`
      // 底色（仅对proxio主题生效）
      #theme-proxio body {
        background-color: #eeedee;
      }
      #theme-proxio .dark body {
        background-color: black;
      }

      // 菜单下划线动画（适配proxio主题）
      #theme-proxio .menu-link {
        text-decoration: none;
        background-image: linear-gradient(#4e80ee, #4e80ee);
        background-repeat: no-repeat;
        background-position: bottom center;
        background-size: 0 2px;
        transition: background-size 100ms ease-in-out;
      }
      #theme-proxio .menu-link:hover {
        background-size: 100% 2px;
        color: #4e80ee;
      }

      ${themeConsoleStyle('next', CONFIG)}
  `}</style>
  )
}

export { Style }
