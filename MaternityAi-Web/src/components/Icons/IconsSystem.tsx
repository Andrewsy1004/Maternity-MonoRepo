import React from 'react';

export interface IconsSystemProps extends React.SVGProps<SVGSVGElement> {
  width?: number;
  height?: number;
  stroke?: string;
  strokeWidth?: number;
  className?: string;
}

export const SvgArrowRight: React.FC<IconsSystemProps> = ({
  width = 24,
  height = 24,
  stroke = 'currentColor',
  strokeWidth = 1.5,
  className = 'size-6',
  ...rest
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    width={width}
    height={height}
    strokeWidth={strokeWidth}
    stroke={stroke}
    className={className}
    {...rest}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m8.25 4.5 7.5 7.5-7.5 7.5"
    />
  </svg>
);

export const SvgArrowLeft: React.FC<IconsSystemProps> = ({
  width = 24,
  height = 24,
  stroke = 'currentColor',
  strokeWidth = 1.5,
  className = 'size-6',
  ...rest
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    width={width}
    height={height}
    strokeWidth={strokeWidth}
    stroke={stroke}
    className={className}
    {...rest}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m15.75 19.5-7.5-7.5 7.5-7.5"
    />
  </svg>
);

export const SvgGear: React.FC<IconsSystemProps> = ({
  width = 24,
  height = 24,
  stroke = 'currentColor',
  strokeWidth = 2,
  className = 'size-6',
  ...rest
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...rest}
  >
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const SvgAicon: React.FC<IconsSystemProps> = ({
  width = 24,
  height = 24,
  className = 'size-6',
  ...rest
}) => (
  <svg
    width={width}
    height={height}
    className={className}
    viewBox="0 0 21 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...rest}
  >
    <path
      d="M3.375 19V14.5M3.375 5.5V1M1 3.25H5.75M1 16.75H5.75M11.45 1.9L9.80253 5.95798C9.53462 6.61788 9.40066 6.94784 9.19235 7.22538C9.00773 7.47136 8.78088 7.68627 8.52123 7.86118C8.22827 8.05852 7.87999 8.18543 7.18342 8.43924L2.9 10L7.18342 11.5608C7.87999 11.8146 8.22827 11.9415 8.52123 12.1388C8.78088 12.3137 9.00773 12.5286 9.19235 12.7746C9.40066 13.0522 9.53462 13.3821 9.80253 14.042L11.45 18.1L13.0975 14.042C13.3654 13.3821 13.4993 13.0522 13.7076 12.7746C13.8923 12.5286 14.1191 12.3137 14.3788 12.1388C14.6717 11.9415 15.02 11.8146 15.7166 11.5608L20 10L15.7166 8.43924C15.02 8.18543 14.6717 8.05852 14.3788 7.86118C14.1191 7.68627 13.8923 7.47136 13.7076 7.22538C13.4993 6.94784 13.3654 6.61788 13.0975 5.95798L11.45 1.9Z"
      stroke="url(#paint0_linear_95_130)"
      strokeOpacity="0.8"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <defs>
      <linearGradient
        id="paint0_linear_95_130"
        x1="10.5"
        y1="1"
        x2="10.5"
        y2="19"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0.475962" stopColor="white" />
      </linearGradient>
    </defs>
  </svg>
);

export const SvgSquare: React.FC<IconsSystemProps> = ({
  width = 38,
  height = 38,
  fill = 'currentColor',
  className = 'size-6',
  ...rest
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 38 38"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...rest}
  >
    <path d="M0 38H38V0H0V38Z" fill={fill} />
  </svg>
);

export const SvgHome: React.FC<IconsSystemProps> = ({
  width = 24,
  height = 24,
  stroke = 'currentColor',
  strokeWidth = 2,
  className = 'size-6',
  ...rest
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...rest}
  >
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

export const SvgBook: React.FC<IconsSystemProps> = ({
  width = 24,
  height = 24,
  stroke = 'currentColor',
  strokeWidth = 2,
  className = 'size-6',
  ...rest
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...rest}
  >
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    <path d="M8 7h6" />
    <path d="M8 11h8" />
    <path d="M12 11v6" />
  </svg>
);

export const SvgUser: React.FC<IconsSystemProps> = ({
  width = 24,
  height = 24,
  stroke = 'currentColor',
  strokeWidth = 2,
  className = 'size-6',
  ...rest
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...rest}
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const SvgClipboard: React.FC<IconsSystemProps> = ({
  width = 24,
  height = 24,
  stroke = 'currentColor',
  strokeWidth = 2,
  className = 'size-6',
  ...rest
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...rest}
  >
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <path d="M9 14h6" />
    <path d="M9 10h6" />
    <path d="M9 18h6" />
  </svg>
);

export const SvgBell: React.FC<IconsSystemProps> = ({
  width = 24,
  height = 24,
  fill = 'none',
  className = '',
  ...rest
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill={fill}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...rest}
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
);

export const SvgSparkle: React.FC<IconsSystemProps> = ({
  width = 24,
  height = 24,
  fill = 'currentColor',
  className = '',
  ...rest
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill={fill}
    className={className}
    {...rest}
  >
    <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
  </svg>
);
