import { Controller, Get, Res } from "@nestjs/common";
import type { Response } from "express";

@Controller()
export class AppController {
  @Get()
  redirectToDemo(@Res() res: Response) {
    res.redirect(302, "/blnk-installment-widget/");
  }
}
