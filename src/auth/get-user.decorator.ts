import { createParamDecorator, ExecutionContext } from '@nestjs/common';

const GetUser = createParamDecorator((_data, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  return req.user;
});

export default GetUser;
