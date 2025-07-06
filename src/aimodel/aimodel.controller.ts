import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AimodelService } from './aimodel.service';
import { CurrentUser } from 'src/auth/user.decorator';

@Controller('aimodel')
export class AimodelController {

    constructor(private readonly aimodelService: AimodelService){}
    
    @UseGuards(JwtAuthGuard)
    @Post('/:projectId/send-message')
    async sendMessage(@Param('projectId') projectId: string, @Body() body: any, @CurrentUser() user: any){
        return await this.aimodelService.sendMessage(projectId, body, user);
    }
}
